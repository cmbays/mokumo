<script lang="ts">
	let status = $state('loading...');

	async function checkHealth() {
		try {
			const res = await fetch('/api/health');
			const data = await res.json();
			status = `${data.status} — v${data.version}`;
		} catch {
			status = 'API unreachable (dev mode: run api separately)';
		}
	}

	$effect(() => {
		checkHealth();
	});
</script>

<svelte:head>
	<title>Mokumo Print</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="text-4xl font-bold tracking-tight">Mokumo Print</h1>
		<p class="mt-2 text-muted-foreground">Production management for decorated apparel</p>
		<div class="mt-6 rounded-lg border bg-card px-6 py-4">
			<p class="font-mono text-sm text-card-foreground">API: {status}</p>
		</div>
	</div>
</main>
