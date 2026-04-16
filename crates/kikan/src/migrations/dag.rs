use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap, HashSet};
use std::sync::Arc;

use crate::error::DagError;
use crate::migrations::{GraftId, Migration, MigrationRef, MigrationTarget};

type MigrationKey = (MigrationTarget, GraftId, &'static str);

pub fn resolve(migrations: &[Arc<dyn Migration>]) -> Result<Vec<Arc<dyn Migration>>, DagError> {
    if migrations.is_empty() {
        return Ok(Vec::new());
    }

    check_duplicates(migrations)?;

    let by_ref = build_ref_index(migrations);
    check_dangling_refs(migrations, &by_ref)?;
    check_cross_target_violations(migrations, &by_ref)?;

    let (adj, mut in_degree) = build_adjacency(migrations, &by_ref);
    kahn_sort(migrations, &adj, &mut in_degree, &by_ref)
}

fn check_duplicates(migrations: &[Arc<dyn Migration>]) -> Result<(), DagError> {
    let mut seen = HashSet::new();
    for m in migrations {
        let key = (m.graft_id(), m.name());
        if !seen.insert(key) {
            return Err(DagError::DuplicateMigration {
                graft: m.graft_id(),
                name: m.name(),
            });
        }
    }
    Ok(())
}

fn build_ref_index(migrations: &[Arc<dyn Migration>]) -> HashMap<(GraftId, &'static str), usize> {
    migrations
        .iter()
        .enumerate()
        .map(|(i, m)| ((m.graft_id(), m.name()), i))
        .collect()
}

fn check_dangling_refs(
    migrations: &[Arc<dyn Migration>],
    by_ref: &HashMap<(GraftId, &'static str), usize>,
) -> Result<(), DagError> {
    for m in migrations {
        for dep in m.dependencies() {
            if !by_ref.contains_key(&(dep.graft, dep.name)) {
                return Err(DagError::DanglingRef {
                    from: MigrationRef {
                        graft: m.graft_id(),
                        name: m.name(),
                    },
                    to: dep,
                });
            }
        }
    }
    Ok(())
}

fn check_cross_target_violations(
    migrations: &[Arc<dyn Migration>],
    by_ref: &HashMap<(GraftId, &'static str), usize>,
) -> Result<(), DagError> {
    for m in migrations {
        if m.target() == MigrationTarget::Meta {
            for dep in m.dependencies() {
                if let Some(&idx) = by_ref.get(&(dep.graft, dep.name))
                    && migrations[idx].target() == MigrationTarget::PerProfile
                {
                    return Err(DagError::CrossTargetViolation {
                        meta: MigrationRef {
                            graft: m.graft_id(),
                            name: m.name(),
                        },
                        per_profile: dep,
                    });
                }
            }
        }
    }
    Ok(())
}

fn build_adjacency(
    migrations: &[Arc<dyn Migration>],
    by_ref: &HashMap<(GraftId, &'static str), usize>,
) -> (Vec<Vec<usize>>, Vec<usize>) {
    let n = migrations.len();
    let mut adj = vec![Vec::new(); n];
    let mut in_degree = vec![0usize; n];

    for (i, m) in migrations.iter().enumerate() {
        for dep in m.dependencies() {
            if let Some(&j) = by_ref.get(&(dep.graft, dep.name)) {
                adj[j].push(i);
                in_degree[i] += 1;
            }
        }
    }

    (adj, in_degree)
}

fn kahn_sort(
    migrations: &[Arc<dyn Migration>],
    adj: &[Vec<usize>],
    in_degree: &mut [usize],
    by_ref: &HashMap<(GraftId, &'static str), usize>,
) -> Result<Vec<Arc<dyn Migration>>, DagError> {
    let mut heap = BinaryHeap::new();
    for (i, &deg) in in_degree.iter().enumerate() {
        if deg == 0 {
            let key: MigrationKey = (
                migrations[i].target(),
                migrations[i].graft_id(),
                migrations[i].name(),
            );
            heap.push(Reverse((key, i)));
        }
    }

    let mut result = Vec::with_capacity(migrations.len());

    while let Some(Reverse((_, idx))) = heap.pop() {
        result.push(Arc::clone(&migrations[idx]));
        for &neighbor in &adj[idx] {
            in_degree[neighbor] -= 1;
            if in_degree[neighbor] == 0 {
                let key: MigrationKey = (
                    migrations[neighbor].target(),
                    migrations[neighbor].graft_id(),
                    migrations[neighbor].name(),
                );
                heap.push(Reverse((key, neighbor)));
            }
        }
    }

    if result.len() != migrations.len() {
        let cycle = find_first_cycle(migrations, in_degree, by_ref);
        return Err(DagError::Cycle { path: cycle });
    }

    Ok(result)
}

fn find_first_cycle(
    migrations: &[Arc<dyn Migration>],
    in_degree: &[usize],
    by_ref: &HashMap<(GraftId, &'static str), usize>,
) -> Vec<MigrationRef> {
    let remaining: Vec<usize> = in_degree
        .iter()
        .enumerate()
        .filter(|&(_, d)| *d > 0)
        .map(|(i, _)| i)
        .collect();

    if remaining.is_empty() {
        return Vec::new();
    }

    let remaining_set: HashSet<usize> = remaining.iter().copied().collect();
    let start = remaining[0];

    let mut adj_remaining: HashMap<usize, Vec<usize>> = HashMap::new();
    for &i in &remaining {
        for dep in migrations[i].dependencies() {
            if let Some(&j) = by_ref.get(&(dep.graft, dep.name))
                && remaining_set.contains(&j)
            {
                adj_remaining.entry(j).or_default().push(i);
            }
        }
    }

    let mut visited = HashSet::new();
    let mut stack = Vec::new();
    let mut on_stack = HashSet::new();

    if let Some(cycle) = dfs_find_cycle(
        start,
        &adj_remaining,
        &mut visited,
        &mut stack,
        &mut on_stack,
        migrations,
    ) {
        return cycle;
    }

    remaining
        .iter()
        .map(|&i| MigrationRef {
            graft: migrations[i].graft_id(),
            name: migrations[i].name(),
        })
        .collect()
}

fn dfs_find_cycle(
    node: usize,
    adj: &HashMap<usize, Vec<usize>>,
    visited: &mut HashSet<usize>,
    stack: &mut Vec<usize>,
    on_stack: &mut HashSet<usize>,
    migrations: &[Arc<dyn Migration>],
) -> Option<Vec<MigrationRef>> {
    visited.insert(node);
    stack.push(node);
    on_stack.insert(node);

    if let Some(neighbors) = adj.get(&node) {
        for &next in neighbors {
            if on_stack.contains(&next) {
                let cycle_start = stack.iter().position(|&n| n == next).unwrap();
                let cycle: Vec<MigrationRef> = stack[cycle_start..]
                    .iter()
                    .map(|&i| MigrationRef {
                        graft: migrations[i].graft_id(),
                        name: migrations[i].name(),
                    })
                    .collect();
                return Some(cycle);
            }
            if !visited.contains(&next)
                && let Some(cycle) = dfs_find_cycle(next, adj, visited, stack, on_stack, migrations)
            {
                return Some(cycle);
            }
        }
    }

    stack.pop();
    on_stack.remove(&node);
    None
}
