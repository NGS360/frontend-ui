import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Folder, Undo2 } from "lucide-react";
import { ClientDataTable } from "./data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { listFilesOptions } from '@/client/@tanstack/react-query.gen';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/data-table/sortable-header";

// Helper function for formatting bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const idx = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

// Helper function to normalize file names
function normalizeFileName(fullPath: string, currentPath: string) {
  return fullPath.replace(currentPath, '').replace(/^\//, '/');
}

// Define column structure
interface FileBrowserColumns {
  name: string,
  date: string,
  size?: number,
  dir: boolean
}

// File browser component
interface FileBrowserProps {

  /** Root path - user unable to navigate above here */
  rootPath: string;
  
  /** Full path to browse */
  directoryPath?: string;

  /** Optional header to display current path */
  showHeader?: boolean;

  /** Optional callback when directory path changes */
  onDirectoryChange?: (path: string) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  rootPath,
  directoryPath = rootPath,
  showHeader = false,
  onDirectoryChange,
}) => {
  // Manage directory path internally, but initialize with directoryPath
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState<string>(directoryPath);

  // Update internal state when directoryPath prop changes
  useEffect(() => {
    setCurrentDirectoryPath(directoryPath);
  }, [directoryPath]);

  // Wrapper for setDirectoryPath that also calls the callback
  const handleDirectoryChange = (newPath: string) => {
    setCurrentDirectoryPath(newPath);
    onDirectoryChange?.(newPath);
  };

  // Query for file/folder data using browseFilesystem
  const { data, isLoading, isError, error } = useQuery({
    ...listFilesOptions({
      query: {
        uri: currentDirectoryPath
      },
    }),
    // placeholderData: keepPreviousData // comment out for now
  });

  // Reformat the data into a structure suitable for rendering to a table
  const tableData: Array<FileBrowserColumns> = [
    ...(data?.folders.map((d) => ({
      name: normalizeFileName(d.name, currentDirectoryPath),
      date: d.date,
      dir: true,
    })) || []),
    ...(data?.files.map((d) => ({
      name: normalizeFileName(d.name, currentDirectoryPath),
      date: d.date,
      size: d.size,
      dir: false,
    })) || [])
  ];

  // Define up/down directory click handlers
  const downDirClickHandler = (next: string) => {
    const newPath = currentDirectoryPath.endsWith('/') 
      ? `${currentDirectoryPath}${next}/`
      : `${currentDirectoryPath}/${next}/`;
    handleDirectoryChange(newPath);
  };
  const upDirClickHandler = () => {
    const parts = currentDirectoryPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    
    // Don't allow navigation above rootPath
    const rootParts = rootPath.split('/').filter(Boolean);
    if (parts.length <= rootParts.length) return;

    // Reconstruct the new path
    const stemPart = parts.slice(0, 2).join('//')
    const endParts = parts.slice(2)
    endParts.pop()
    const end = endParts.join('/')
    const newPath = end ? [stemPart, end].join('/') : stemPart;
    handleDirectoryChange(newPath.endsWith('/') ? newPath : newPath + '/');
  };

  // Define columns for file display component
  const columns: Array<ColumnDef<FileBrowserColumns>> = [
    {
      accessorKey: 'name',
      meta: { alias: 'Name' },
      header: ({ column }) => <SortableHeader column={column} name="Name" />,
      cell: ({ cell }) => {
        const { dir, name } = cell.row.original;
        return (
          <span
            className="flex gap-2 items-center hover:underline hover:cursor-pointer text-primary"
            onClick={() => dir && downDirClickHandler(name)}
          >
            <Folder className={`size-4 ${dir ? 'opacity-100' : 'opacity-0'}`} />
            {dir ? name.replace('/', '') : name}
          </span>
        );
      },
    },
    {
      accessorKey: 'size',
      meta: { alias: 'Size' },
      header: ({ column }) => <SortableHeader column={column} name="Size" />,
      cell: ({ row }) => {
        const { dir, size } = row.original;
        return !dir && size != null ? formatBytes(size) : '-';
      },
    },
    {
      accessorKey: 'date',
      meta: { alias: 'Modified' },
      header: ({ column }) => <SortableHeader column={column} name="Modified" />,
      cell: ({ row }) => {
        const { date } = row.original;
        return date !== '-' ? new Date(date).toLocaleString() : '-';
      },
    },
  ];

  if (isError) {
    return <div className="p-4 text-center text-destructive">Error: {error.message || 'Failed to load directory.'}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <h2 className="text-lg font-medium text-muted-foreground break-words">
          Files for {currentDirectoryPath}
        </h2>
      )}
      <ClientDataTable
        data={tableData}
        columns={columns}
        renderCustomRowComponent={currentDirectoryPath !== rootPath}
        customRowComponent={() => (
          <span
            className="flex gap-2 items-center hover:underline hover:cursor-pointer text-primary"
            onClick={upDirClickHandler}
          >
            <Undo2 className={`size-4`} />
            Up a level
          </span>
        )}
        isLoading={isLoading}
      />
    </div>
  );
};

// File browser dialog component
interface FileBrowserDialogProps extends Omit<FileBrowserProps, 'onDirectoryChange' | 'showHeader'> {
  /** Child element that triggers the dialog to open */
  trigger: React.ReactElement;
}

export const FileBrowserDialog: React.FC<FileBrowserDialogProps> = ({
  trigger,
  rootPath,
  directoryPath = rootPath
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState<string>(directoryPath);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-muted-foreground max-w-3xl text-wrap break-words whitespace-normal">
            Files for {currentDirectory}
          </DialogTitle>
          <DialogDescription className="hidden">Browse files in bucket</DialogDescription>
        </DialogHeader>
        <div className="overflow-auto px-2 pt-2">
          <FileBrowser
            rootPath={rootPath}
            directoryPath={currentDirectory}
            onDirectoryChange={setCurrentDirectory}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};