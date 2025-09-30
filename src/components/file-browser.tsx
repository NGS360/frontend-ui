import { useState } from "react";
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Folder, Undo2 } from "lucide-react";
import { ClientDataTable } from "./data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { browseFilesystemOptions } from '@/client/@tanstack/react-query.gen';
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

// Define column structure
interface FileBrowserColumns {
  name: string,
  date: string,
  size?: number,
  dir: boolean
}


// File browser component
interface FileBrowserProps {
  /** Query params for browseFilesystem (must include directory_path, storage_root, etc) */
  queryParams: Record<string, any>;
  /** Optional header to display current path */
  showHeader?: boolean;
  /** Optional callback when directory path changes */
  onDirectoryChange?: (path: string) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  queryParams,
  showHeader = false,
  onDirectoryChange,
}) => {
  // Manage directory path internally
  const initialPath = queryParams.directory_path || '';
  const [directoryPath, setDirectoryPath] = useState<string>(initialPath);

  // Wrapper for setDirectoryPath that also calls the callback
  const handleDirectoryChange = (newPath: string) => {
    setDirectoryPath(newPath);
    onDirectoryChange?.(newPath);
  };

  // Query for file/folder data using browseFilesystem
  const { data, isLoading, isError, error } = useQuery({
    ...browseFilesystemOptions({
      query: {
        ...queryParams,
        directory_path: directoryPath,
      },
    }),
    placeholderData: keepPreviousData
  });

  // Reformat the data into a structure suitable for rendering to a table
  const tableData: Array<FileBrowserColumns> = [];
  data?.folders?.forEach((d) => {
    const newName = d.name.replace(directoryPath, '').replace(/^\//, '');
    tableData.push({
      name: newName,
      date: d.date,
      dir: true,
    });
  });
  data?.files?.forEach((d) => {
    const newName = d.name.replace(directoryPath, '').replace(/^\//, '');
    tableData.push({
      name: newName,
      date: d.date,
      size: d.size,
      dir: false,
    });
  });

  // Define up/down directory click handlers
  const downDirClickHandler = (next: string) => {
    let newPath = directoryPath;
    if (!newPath.endsWith('/')) newPath += '/';
    newPath += next;
    if (!newPath.endsWith('/')) newPath += '/';
    handleDirectoryChange(newPath);
  };
  const upDirClickHandler = () => {
    const parts = directoryPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    const newPath = parts.slice(0, -1).join('/') + (parts.length > 1 ? '/' : '');
    handleDirectoryChange(newPath || '');
  };

  // Only show "Up a level" if normalized directoryPath and initialPath differ
  const normalizedPath = directoryPath.replace(/\/+$/, '');
  const normalizedInitial = initialPath.replace(/\/+$/, '');

  // Define columns for file display component
  const columns: Array<ColumnDef<FileBrowserColumns>> = [
    {
      accessorKey: 'name',
      meta: { alias: 'Name' },
      header: ({ column }) => <SortableHeader column={column} name="Name" />,
      cell: ({ cell }) => {
        const isDir = cell.row.original.dir;
        const value = cell.row.original.name;
        return (
          <span
            className="flex gap-2 items-center hover:underline hover:cursor-pointer text-primary"
            onClick={() => (isDir ? downDirClickHandler(value) : undefined)}
          >
            <Folder className={`size-4 ${isDir ? 'opacity-100' : 'opacity-0'}`} />
            {isDir ? value.replace('/', '') : value}
          </span>
        );
      },
    },
    {
      accessorKey: 'size',
      meta: { alias: 'Size' },
      header: ({ column }) => <SortableHeader column={column} name="Size" />,
      cell: ({ row }) => {
        const isDir = row.original.dir;
        const size = row.original.size;
        return !isDir && size != null ? formatBytes(size) : '-';
      },
    },
    {
      accessorKey: 'date',
      meta: { alias: 'Modified' },
      header: ({ column }) => <SortableHeader column={column} name="Modified" />,
      cell: ({ row }) => {
        const raw = row.original.date;
        const value = raw !== '-' ? new Date(raw).toLocaleString() : '-';
        return value;
      },
    },
  ];

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }
  if (isError) {
    return <div className="p-4 text-center text-destructive">Error: {error.message || 'Failed to load directory.'}</div>;
  }

  // Compose display path for header (same logic as dialog)
  let displayRoot = directoryPath;
  if (queryParams.storage_root) {
    displayRoot = `${queryParams.storage_root}${directoryPath ? '/' + directoryPath.replace(/^\/+/, '') : ''}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <h2 className="text-lg font-medium text-muted-foreground break-words">
          Files for {displayRoot || queryParams.storage_root || ''}
        </h2>
      )}
      <ClientDataTable
        data={tableData}
        columns={columns}
        renderCustomRowComponent={normalizedPath !== normalizedInitial}
        customRowComponent={() => (
          <span
            className="flex gap-2 items-center hover:underline hover:cursor-pointer text-primary"
            onClick={upDirClickHandler}
          >
            <Undo2 className={`size-4`} />
            Up a level
          </span>
        )}
      />
    </div>
  );
};

// File browser dialog component
interface FileBrowserDialogProps {
  /** Query params for browseFilesystem (must include directory_path, storage_root, etc) */
  queryParams: Record<string, any>;
  /** Child element that triggers the dialog to open */
  trigger: React.ReactElement;
}

export const FileBrowserDialog: React.FC<FileBrowserDialogProps> = ({
  trigger,
  queryParams,
}) => {
  // Control dialog open/close state
  const [isOpen, setIsOpen] = useState(false);
  const handleOnOpenChange = (willOpen: boolean) => {
    setIsOpen(willOpen);
  };

  // Track current directory for title updates
  const [currentDirectory, setCurrentDirectory] = useState<string>(queryParams.directory_path || '');

  // Compose display path for header
  let displayRoot = currentDirectory;
  if (queryParams.storage_root) {
    displayRoot = `${queryParams.storage_root}${currentDirectory ? '/' + currentDirectory.replace(/^\/+/, '') : ''}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-muted-foreground max-w-3xl text-wrap break-words whitespace-normal">
            Files for {displayRoot || queryParams.storage_root || ''}
          </DialogTitle>
          <DialogDescription className="hidden">Browse files in bucket</DialogDescription>
        </DialogHeader>
        <div className="overflow-auto px-2 pt-2">
          <FileBrowser
            queryParams={queryParams}
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