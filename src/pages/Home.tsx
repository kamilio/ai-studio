import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { storageService } from "@/lib/storage";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const message = storageService.createMessage({
      role: "user",
      content: trimmed,
      parentId: null,
    });

    navigate(`/lyrics/${message.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl flex flex-col gap-3"
        aria-label="New song prompt"
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What song do you want to make?"
          className="resize-none min-h-[120px] text-base"
          aria-label="Song prompt"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
        />
        <Button type="submit" disabled={!prompt.trim()} className="self-end">
          Start
        </Button>
      </form>
    </div>
  );
}
