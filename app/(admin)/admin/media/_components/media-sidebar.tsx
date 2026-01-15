//app/(admin)/admin/media/_components/media-sidebar.tsx

"use client";

import { useState } from "react";
import { Folder, FolderOpen, MoreVertical, Plus, Trash2, Edit2, ChevronRight, ChevronDown, LayoutGrid, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"; 
import { cn } from "@/lib/utils";

// Types
type FolderType = {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { files: number; children: number };
  children?: FolderType[];
};

interface MediaSidebarProps {
  folders: FolderType[];
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: FolderType) => void;
  onDeleteFolder: (folderId: string) => void;
  // 🔥 NEW: Drop Handler
  onDropFile: (e: React.DragEvent, folderId: string | null) => void;
  // 🔥 NEW: Mobile Close Support
  onCloseMobile?: () => void;
  className?: string;
}

export function MediaSidebar({ 
  folders, 
  currentFolderId, 
  onSelectFolder, 
  onCreateFolder, 
  onRenameFolder, 
  onDeleteFolder,
  onDropFile,
  onCloseMobile,
  className 
}: MediaSidebarProps) {
  
  const buildTree = (items: FolderType[]) => {
    const rootItems: FolderType[] = [];
    const lookup: Record<string, FolderType> = {};
    items.forEach(item => { lookup[item.id] = { ...item, children: [] }; });
    items.forEach(item => {
        if (item.parentId && lookup[item.parentId]) {
            lookup[item.parentId].children?.push(lookup[item.id]);
        } else {
            rootItems.push(lookup[item.id]);
        }
    });
    return rootItems;
  };

  const treeData = buildTree(folders);

  // 🔥 Root Folder Drop Logic
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const handleRootDrop = (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setIsRootDragOver(false);
      onDropFile(e, null);
  };

  return (
    <div className={cn("w-64 bg-white border-r border-slate-200 flex flex-col h-full", className)}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Folders</span>
        <div className="flex gap-1">
            <button 
                onClick={() => onCreateFolder(currentFolderId === "ALL_MEDIA_SEARCH" ? null : currentFolderId)}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 hover:text-indigo-600 transition"
                title="New Folder"
            >
                <Plus size={16}/>
            </button>
            {/* Mobile Close Button */}
            <button onClick={onCloseMobile} className="lg:hidden p-1.5 hover:text-red-500">
                <X size={16}/>
            </button>
        </div>
      </div>

      {/* Tree Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        
        {/* Root Option */}
        <div 
            onClick={() => { onSelectFolder(null); if(onCloseMobile) onCloseMobile(); }}
            onDragOver={(e) => { e.preventDefault(); setIsRootDragOver(true); }}
            onDragLeave={() => setIsRootDragOver(false)}
            onDrop={handleRootDrop}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 group border-2 border-transparent",
                currentFolderId === null ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50",
                isRootDragOver && "border-indigo-500 bg-indigo-50"
            )}
        >
            <LayoutGrid size={16} className={currentFolderId === null ? "text-indigo-600" : "text-slate-400"}/>
            <span>All Files / Root</span>
        </div>

        {/* Tree */}
        {treeData.map(folder => (
            <FolderItem 
                key={folder.id} 
                folder={folder} 
                currentFolderId={currentFolderId}
                onSelect={(id: string) => { onSelectFolder(id); if(onCloseMobile) onCloseMobile(); }}
                onAddChild={onCreateFolder}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
                onDrop={onDropFile}
                depth={0}
            />
        ))}
      </div>
    </div>
  );
}

// --- Recursive Folder Item ---
function FolderItem({ folder, currentFolderId, onSelect, onAddChild, onRename, onDelete, onDrop, depth }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const hasChildren = folder.children && folder.children.length > 0;
    const isActive = currentFolderId === folder.id;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(false);
        onDrop(e, folder.id);
    };

    return (
        <div className="select-none">
            <div 
                className={cn(
                    "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm border-2 border-transparent",
                    isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50",
                    isDragOver && "border-indigo-500 bg-indigo-50 z-10"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={(e) => { e.stopPropagation(); onSelect(folder.id); }}
                // 🔥 DnD Handlers
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                onDrop={handleDrop}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={cn("p-0.5 rounded hover:bg-slate-200 transition", !hasChildren && "opacity-0")}
                    >
                        {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </button>

                    {isExpanded || isActive ? (
                        <FolderOpen size={16} className={isActive ? "text-indigo-600" : "text-amber-400"} />
                    ) : (
                        <Folder size={16} className={isActive ? "text-indigo-600" : "text-amber-400"} />
                    )}

                    <span className="truncate">{folder.name}</span>
                    
                    {folder._count?.files > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full ml-1">
                            {folder._count.files}
                        </span>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500">
                            <MoreVertical size={14}/>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuItem onClick={() => onAddChild(folder.id)}> <Plus size={14} className="mr-2"/> Sub-folder </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(folder)}> <Edit2 size={14} className="mr-2"/> Rename </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(folder.id)} className="text-red-600"> <Trash2 size={14} className="mr-2"/> Delete </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isExpanded && hasChildren && (
                <div>
                    {folder.children.map((child: any) => (
                        <FolderItem 
                            key={child.id} folder={child} currentFolderId={currentFolderId}
                            onSelect={onSelect} onAddChild={onAddChild} onRename={onRename}
                            onDelete={onDelete} onDrop={onDrop} depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}