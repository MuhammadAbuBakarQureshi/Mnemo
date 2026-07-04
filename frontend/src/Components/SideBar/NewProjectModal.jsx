import { useState } from "react";
import { X } from "lucide-react";

/**
 * NewProjectModal
 *
 * Props:
 * - open: boolean
 * - onClose(): called to dismiss without creating
 * - onCreate({ name, description }): called with trimmed values when valid
 */
export default function NewProjectModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const nameError = touched && name.trim().length === 0;

  const reset = () => {
    setName("");
    setDescription("");
    setTouched(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setTouched(true);
      return;
    }
    onCreate({ name: trimmedName, description: description.trim() });
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(46, 37, 32, 0.35)" }}
      onClick={handleClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA") {
            handleCreate();
          }
        }}
        style={{ width: "min(100%, 380px)" }}
        className="relative rounded-3xl border border-border bg-cream p-6 shadow-xl sm:p-7"
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-black/5"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <h2 className="text-[20px] font-bold tracking-tight text-ink">
          New project
        </h2>

        <div className="mt-6 flex flex-col gap-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-[14px] font-bold text-ink">
              Project name
              <span className="text-asterisk">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Q3 research notes"
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-[#A89B8C] ${
                nameError ? "border-asterisk" : "border-border"
              }`}
            />
            {nameError && (
              <p className="mt-1.5 text-[13px] text-asterisk">
                Project name is required
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[14px] font-bold text-ink">
              Description{" "}
              <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project about?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-[#A89B8C]"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-bold tracking-tight text-ink transition-colors hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-ink px-5 py-2.5 text-[14px] font-bold tracking-tight text-cream transition-opacity hover:opacity-90 active:opacity-80"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
