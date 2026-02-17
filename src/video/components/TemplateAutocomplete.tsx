/**
 * TemplateAutocomplete — floating dropdown for {{ template variable insertion.
 *
 * US-059: {{ autocomplete tiptap extension for prompt editor.
 *
 * Renders a positioned dropdown below the cursor whenever the user types `{{`
 * in a prompt editor (tiptap in Shot mode or plain textarea in Write mode).
 *
 * Sections:
 *   - SCRIPT TEMPLATES: local templates for the current script (omitted when empty)
 *   - GLOBAL TEMPLATES: shared templates (always shown when available)
 *   - Divider between sections shown only when both are non-empty
 *
 * Filtering: both sections filter by prefix-match on `query` (case-insensitive).
 *
 * Behaviour:
 *   - Clicking an item calls onSelect(name) and closes the dropdown.
 *   - Pressing Escape calls onClose() (parent must handle the keydown event).
 *   - Clicking outside calls onClose() (parent must handle mousedown event).
 *   - onMouseDown on items uses preventDefault() to avoid blurring the editor.
 *
 * Usage:
 *   <TemplateAutocomplete
 *     open={autocompleteOpen}
 *     query={autocompleteQuery}
 *     localTemplates={localTemplates}
 *     globalTemplates={globalTemplates}
 *     onSelect={(name) => insertTemplate(name)}
 *     containerRef={autocompleteRef}
 *   />
 *
 * The `containerRef` is forwarded to the dropdown root div so that the parent
 * can use it for outside-click detection.
 */

import { forwardRef } from "react";
import type { LocalTemplate, GlobalTemplate } from "../lib/storage/types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TemplateAutocompleteProps {
  /** Whether the dropdown is visible. */
  open: boolean;
  /** Text typed after `{{` — used to filter by prefix match. */
  query: string;
  /** Local (per-script) templates. Section is omitted when empty after filtering. */
  localTemplates: LocalTemplate[];
  /** Global templates shared across all scripts. */
  globalTemplates: GlobalTemplate[];
  /** Called when the user selects an item (click or Enter). Receives template name. */
  onSelect: (name: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Floating autocomplete dropdown for template variable insertion.
 *
 * The ref is forwarded to the dropdown root `<div>` so the parent can check
 * `ref.current.contains(e.target)` in an outside-click handler.
 */
const TemplateAutocomplete = forwardRef<HTMLDivElement, TemplateAutocompleteProps>(
  function TemplateAutocomplete({ open, query, localTemplates, globalTemplates, onSelect }, ref) {
    // Filter both lists by prefix match on template name (case-insensitive)
    const filteredLocal = localTemplates.filter((t) =>
      t.name.toLowerCase().startsWith(query.toLowerCase())
    );
    const filteredGlobal = globalTemplates.filter((t) =>
      t.name.toLowerCase().startsWith(query.toLowerCase())
    );

    // Nothing to show — render nothing
    if (!open || (filteredLocal.length === 0 && filteredGlobal.length === 0)) {
      return null;
    }

    const showLocalSection = filteredLocal.length > 0;
    const showDivider = filteredLocal.length > 0 && filteredGlobal.length > 0;
    const showGlobalSection = filteredGlobal.length > 0;

    return (
      <div
        ref={ref}
        className="absolute left-0 top-full mt-1 z-50 min-w-[200px] max-w-[320px] rounded-md border border-border bg-background shadow-lg py-1"
        data-testid="template-autocomplete"
      >
        {/* ── Script Templates section ─────────────────────────────────────── */}
        {showLocalSection && (
          <>
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Script Templates
            </div>
            {filteredLocal.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onMouseDown={(e) => {
                  // Prevent blur on the editor before insertion
                  e.preventDefault();
                  onSelect(tmpl.name);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                data-testid={`autocomplete-local-${tmpl.name}`}
              >
                <span className="font-mono text-primary text-xs">{`{{${tmpl.name}}}`}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {tmpl.value.slice(0, 40)}
                </span>
              </button>
            ))}
          </>
        )}

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        {showDivider && <div className="my-1 border-t border-border" />}

        {/* ── Global Templates section ─────────────────────────────────────── */}
        {showGlobalSection && (
          <>
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Global Templates
            </div>
            {filteredGlobal.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(tmpl.name);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                data-testid={`autocomplete-global-${tmpl.name}`}
              >
                <span className="font-mono text-primary text-xs">{`{{${tmpl.name}}}`}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {tmpl.value.slice(0, 40)}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    );
  }
);

export default TemplateAutocomplete;
