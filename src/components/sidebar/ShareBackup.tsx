import React from 'react';

interface Props {
  exportJson: () => void;
  importJson: (payload: any) => void;
  copyLink: () => Promise<void>;
  reset: () => void;
}

const ShareBackup: React.FC<Props> = ({ exportJson, importJson, copyLink, reset }) => {
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <section className="section">
      <h3>Share / Backup</h3>
      <div className="button-group button-group-margin" style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn"
          style={{ flex: 1 }}
          title="Download current scene as JSON"
          onClick={exportJson}
        >
          Export JSON
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          title="Load scene from JSON"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          id="importSceneFile"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            try {
              const payload = JSON.parse(text);
              importJson(payload);
            } catch {}
          }}
        />
        <button
          className="btn"
          style={{ flex: 1 }}
          title="Copy a shareable permalink"
          onClick={() => copyLink()}
        >
          Copy Link
        </button>
        <button
          className="btn danger"
          style={{ flex: 1 }}
          title="Reset and clear all saved state"
          onClick={reset}
        >
          Reset & Clear
        </button>
      </div>
    </section>
  );
};

export default ShareBackup;
