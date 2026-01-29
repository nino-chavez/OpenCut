"use client";

import { Keyboard, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type KeyboardShortcut,
  useKeyboardShortcutsHelp,
} from "@/hooks/use-keyboard-shortcuts-help";
import { useKeybindingsStore } from "@/stores/keybindings-store";
import { ShortcutKey } from "@/types/keybinding";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface RecordingState {
  shortcut: KeyboardShortcut;
  keyToReplace: ShortcutKey | null; // null means adding a new key
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState | null>(
    null
  );

  const {
    updateKeybinding,
    removeKeybinding,
    getKeybindingString,
    validateKeybinding,
    setIsRecording,
    resetToDefaults,
    isRecording,
  } = useKeybindingsStore();

  // Get shortcuts from centralized hook
  const { shortcuts } = useKeyboardShortcutsHelp();

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  useEffect(() => {
    if (!isRecording || !recordingState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyString = getKeybindingString(e);
      if (keyString) {
        // Check for conflicts with other actions (not the current one)
        const conflict = validateKeybinding(
          keyString,
          recordingState.shortcut.action
        );
        if (conflict) {
          toast.error(
            `Key "${keyString}" is already bound to "${conflict.existingAction}"`
          );
          setRecordingState(null);
          setIsRecording(false);
          return;
        }

        // If editing an existing key, remove only that specific key
        if (recordingState.keyToReplace) {
          removeKeybinding(recordingState.keyToReplace);
        }

        // Add the new keybinding
        updateKeybinding(keyString, recordingState.shortcut.action);

        setIsRecording(false);
        setRecordingState(null);
      }
    };

    const handleClickOutside = () => {
      setRecordingState(null);
      setIsRecording(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    recordingState,
    getKeybindingString,
    updateKeybinding,
    removeKeybinding,
    validateKeybinding,
    setIsRecording,
    isRecording,
  ]);

  const handleStartRecording = (
    shortcut: KeyboardShortcut,
    keyToReplace: ShortcutKey | null
  ) => {
    setRecordingState({ shortcut, keyToReplace });
    setIsRecording(true);
  };

  const handleRemoveKey = (
    shortcut: KeyboardShortcut,
    keyToRemove: ShortcutKey
  ) => {
    // Don't allow removing if it's the last shortcut for this action
    if (shortcut.keys.length <= 1) {
      toast.error("Cannot remove the last shortcut for this action");
      return;
    }
    removeKeybinding(keyToRemove);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="text" size="sm" className="gap-2">
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your video editing workflow with these keyboard shortcuts.
            Click any shortcut to edit it, or hover and click + to add more.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-grow scrollbar-thin">
          <div className="space-y-6 p-6 pt-2">
            {categories.map((category) => (
              <div key={category} className="flex flex-col gap-1">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {shortcuts
                    .filter((shortcut) => shortcut.category === category)
                    .map((shortcut) => (
                      <ShortcutItem
                        key={shortcut.action}
                        shortcut={shortcut}
                        recordingState={recordingState}
                        onStartRecording={handleStartRecording}
                        onRemoveKey={handleRemoveKey}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 p-6 pt-4">
          <Button size="sm" variant="destructive" onClick={resetToDefaults}>
            Reset to Default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutItem({
  shortcut,
  recordingState,
  onStartRecording,
  onRemoveKey,
}: {
  shortcut: KeyboardShortcut;
  recordingState: RecordingState | null;
  onStartRecording: (
    shortcut: KeyboardShortcut,
    keyToReplace: ShortcutKey | null
  ) => void;
  onRemoveKey: (shortcut: KeyboardShortcut, keyToRemove: ShortcutKey) => void;
}) {
  const isRecordingThisAction =
    recordingState?.shortcut.action === shortcut.action;
  const isAddingNew =
    isRecordingThisAction && recordingState?.keyToReplace === null;

  // Filter out lowercase duplicates for display - if both "j" and "J" exist, only show "J"
  const displayKeys = shortcut.keys.filter((key: string) => {
    if (
      key.includes("Cmd") &&
      shortcut.keys.includes(key.replace("Cmd", "Ctrl"))
    )
      return false;

    return true;
  });

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        {shortcut.icon && (
          <div className="text-muted-foreground">{shortcut.icon}</div>
        )}
        <span className="text-sm">{shortcut.description}</span>
      </div>
      <div className="flex items-center gap-1">
        {displayKeys.map((key: string, index: number) => {
          const isRecordingThisKey =
            isRecordingThisAction &&
            recordingState?.keyToReplace === (key as ShortcutKey);
          return (
            <div key={key} className="flex items-center gap-1">
              <div className="flex items-center relative">
                {key.split("+").map((keyPart: string, partIndex: number) => {
                  const keyId = `${shortcut.id}-${index}-${partIndex}`;
                  return (
                    <EditableShortcutKey
                      key={keyId}
                      isRecording={isRecordingThisKey}
                      onStartRecording={() =>
                        onStartRecording(shortcut, key as ShortcutKey)
                      }
                    >
                      {keyPart}
                    </EditableShortcutKey>
                  );
                })}
                {/* Remove button - only show if there's more than one shortcut */}
                {displayKeys.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveKey(shortcut, key as ShortcutKey);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Remove this shortcut"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {index < displayKeys.length - 1 && (
                <span className="text-xs text-muted-foreground mx-1">or</span>
              )}
            </div>
          );
        })}
        {/* Add new shortcut button */}
        {isAddingNew ? (
          <Button
            variant="outline"
            size="sm"
            className="font-sans px-2 min-w-6 min-h-6 leading-none ml-1 border-primary bg-primary/10"
            title="Press any key combination..."
          >
            ...
          </Button>
        ) : (
          <Button
            variant="text"
            size="sm"
            className="px-1 min-w-6 min-h-6 !opacity-0 group-hover:!opacity-100 transition-opacity ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onStartRecording(shortcut, null);
            }}
            title="Add another shortcut"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function EditableShortcutKey({
  children,
  isRecording,
  onStartRecording,
}: {
  children: React.ReactNode;
  isRecording: boolean;
  onStartRecording: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartRecording();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`font-sans px-2 min-w-6 min-h-6 leading-none mr-1 hover:bg-opacity-80 ${
        isRecording ? "border-primary bg-primary/10" : "border bg-accent/50"
      }`}
      onClick={handleClick}
      title={
        isRecording ? "Press any key combination..." : "Click to edit shortcut"
      }
    >
      {children}
    </Button>
  );
}