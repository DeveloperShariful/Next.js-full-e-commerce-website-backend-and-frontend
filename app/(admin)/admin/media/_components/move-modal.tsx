//app/(admin)/admin/media/_components/move-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Input import
import { moveMediaToFolder } from "@/app/actions/admin/media/media-move";
import { getFolderTree, createFolder } from "@/app/actions/admin/media/folder-actions"; // Create Action
import { toast } from "react-hot-toast";
import { Loader2, FolderInput, Folder, ChevronRight, Plus, FolderPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
  currentFolderId: string | null;
}

export function MoveModal({ isOpen, onClose, selectedIds, onSuccess, currentFolderId }: MoveModalProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [moving, setMoving] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  // New Folder States
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch folders
  const fetchFolders = async () => {
    setLoadingFolders(true);
    const res = await getFolderTree();
    if(res.success) setFolders(res.data as any);
    setLoadingFolders(false);
  };

  useEffect(() => {
    if (isOpen) {
        fetchFolders();
        setTargetId(null);
        setIsCreating(false);
    }
  }, [isOpen]);

  const handleMove = async () => {
    if (targetId === currentFolderId) {
        return toast.error("Items are already in this folder.");
    }
    setMoving(true);
    const res = await moveMediaToFolder(selectedIds, targetId);
    setMoving(false);

    if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
    } else {
        toast.error(res.message);
    }
  };

  // 🔥 Create Folder Logic Inside Modal
  const handleCreateFolder = async () => {
      if(!newFolderName.trim()) return toast.error("Enter folder name");
      setCreating(true);
      // Create folder at root level or currently selected target? 
      // For simplicity, let's create at Root for now, or inside selected target if you want nested.
      // Here creating at Root level to keep it simple in this modal.
      const res = await createFolder(newFolderName, null);
      setCreating(false);

      if(res.success) {
          toast.success("Folder created");
          setNewFolderName("");
          setIsCreating(false);
          fetchFolders(); // Refresh list
      } else {
          toast.error(res.message);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-2">
                <FolderInput size={20} className="text-blue-600"/> 
                <span>Move {selectedIds.length} Item{selectedIds.length > 1 ? 's' : ''}</span>
            </div>
            
            {/* Toggle Create Mode */}
            {!isCreating && (
                <Button 
                    size="sm" variant="ghost" 
                    onClick={() => setIsCreating(true)}
                    className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Plus size={14} className="mr-1"/> New Folder
                </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Create Folder Input Area */}
        {isCreating && (
            <div className="flex gap-2 items-center p-2 bg-slate-50 border border-slate-200 rounded-md animate-in slide-in-from-top-2">
                <FolderPlus size={18} className="text-slate-400"/>
                <Input 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New Folder Name..."
                    className="h-8 text-sm"
                    autoFocus
                />
                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={handleCreateFolder} disabled={creating}>
                    {creating ? <Loader2 size={14} className="animate-spin"/> : "Create"}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setIsCreating(false)}>
                    <X size={14}/>
                </Button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto py-2 -mx-2 px-2 custom-scrollbar">
            {loadingFolders ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
            ) : (
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-2">Select Destination</p>
                    
                    {/* Root Option */}
                    <div 
                        onClick={() => setTargetId(null)}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all",
                            targetId === null 
                                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                                : "bg-white border-transparent hover:bg-slate-100 text-slate-600"
                        )}
                    >
                        <div className="p-1.5 bg-white rounded-md border border-slate-100 shadow-sm">
                            <Folder size={16} className={targetId === null ? "text-blue-500" : "text-slate-400"}/>
                        </div>
                        <span className="font-medium text-sm">Root Folder (Uncategorized)</span>
                        {targetId === null && <ChevronRight size={16} className="ml-auto opacity-50"/>}
                    </div>

                    {/* Folder List */}
                    {folders.map(folder => (
                        <div 
                            key={folder.id}
                            onClick={() => setTargetId(folder.id)}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all",
                                targetId === folder.id 
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                                    : "bg-white border-transparent hover:bg-slate-100 text-slate-600",
                                folder.id === currentFolderId && "opacity-50 pointer-events-none bg-slate-50" 
                            )}
                        >
                            <div className="p-1.5 bg-white rounded-md border border-slate-100 shadow-sm">
                                <Folder size={16} className={targetId === folder.id ? "text-blue-500" : "text-amber-400"} fill={targetId === folder.id ? "none" : "currentColor"} fillOpacity={0.2}/>
                            </div>
                            <span className="font-medium text-sm">{folder.name}</span>
                            {folder.id === currentFolderId && <span className="ml-auto text-[10px] bg-slate-200 px-2 rounded-full">Current</span>}
                            {targetId === folder.id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <DialogFooter className="mt-2 border-t pt-3">
            <Button variant="outline" onClick={onClose} disabled={moving}>Cancel</Button>
            <Button onClick={handleMove} disabled={moving} className="bg-blue-600 hover:bg-blue-700 w-32">
                {moving ? <Loader2 className="animate-spin mr-2" size={16}/> : null}
                {moving ? "Moving..." : "Move Here"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}