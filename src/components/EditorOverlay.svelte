<script lang="ts">
  import { SAMPLES, type SamplePolicy } from "../lib/samples";

  interface Props {
    open: boolean;
    policyText: string;
    parseError: { line: number; column: number; message: string } | null;
    onClose: () => void;
    onApply: (text: string) => void;
    onTextChange: (text: string) => void;
  }

  let { open, policyText, parseError, onClose, onApply, onTextChange }: Props = $props();

  let localText = $state("");
  let fileInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (open) localText = policyText;
  });

  function handleApply(): void {
    onApply(localText);
    onClose();
  }

  function handleSample(sample: SamplePolicy): void {
    localText = sample.content;
    onTextChange(sample.content);
  }

  function handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localText = String(reader.result ?? "");
      onTextChange(localText);
    };
    reader.readAsText(file);
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localText = String(reader.result ?? "");
      onTextChange(localText);
    };
    reader.readAsText(file);
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }
</script>

{#if open}
  <div class="overlay" role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === "Escape" && onClose()}>
    <div class="panel">
      <div class="header">
        <h2>Load Policy File</h2>
        <button class="close-btn" onclick={onClose}>×</button>
      </div>
      <div class="toolbar">
        <button class="btn" onclick={() => fileInput?.click()}>Upload File</button>
        <input bind:this={fileInput} type="file" accept=".json,.hujson,.txt" hidden onchange={handleFileUpload} />
        <div class="samples">
          <span class="label">Samples:</span>
          {#each SAMPLES as sample}
            <button class="sample-btn" onclick={() => handleSample(sample)}>{sample.name}</button>
          {/each}
        </div>
      </div>
      <div
        class="editor-area"
        role="region"
        aria-label="Drop zone"
        ondrop={handleDrop}
        ondragover={handleDragOver}
      >
        <textarea
          bind:value={localText}
          placeholder="Paste your Tailscale policy file here (huJSON)..."
          spellcheck="false"
        ></textarea>
      </div>
      {#if parseError}
        <div class="error">
          <strong>Parse error</strong> at line {parseError.line}, column {parseError.column}: {parseError.message}
        </div>
      {/if}
      <div class="actions">
        <button class="btn secondary" onclick={onClose}>Cancel</button>
        <button class="btn primary" onclick={handleApply}>Visualize</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .panel {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 90vw;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .close-btn:hover {
    background: var(--border);
    color: var(--text);
  }
  .toolbar {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .samples {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .label {
    font-size: 12px;
    color: var(--text-muted);
  }
  .sample-btn {
    font-size: 11px;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }
  .sample-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .editor-area {
    flex: 1;
    padding: 16px 20px;
    min-height: 300px;
  }
  textarea {
    width: 100%;
    height: 100%;
    min-height: 300px;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    font-family: "JetBrains Mono", "SF Mono", monospace;
    font-size: 12px;
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .error {
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.1);
    border-top: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    font-size: 12px;
  }
  .actions {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
  }
  .btn:hover {
    border-color: var(--accent);
  }
  .btn.primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .btn.primary:hover {
    opacity: 0.9;
  }
  .btn.secondary {
    background: transparent;
  }
</style>
