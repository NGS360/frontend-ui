import {  useState } from "react";
import { Folder, Undo2 } from "lucide-react";
import { ClientDataTable } from "./data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/data-table/sortable-header";

// Helper function for formatting bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = Math.max(0, decimals)
  const idx = Math.floor(Math.log(bytes) / Math.log(k))
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx]
}

// Define shape for file browser data
export interface FileBrowserData {
  folders: [
    {
      name: string,
      date: string
    }
  ],
  files: [
    {
      name: string,
      date: string,
      size: number
    }
  ]
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
  /** Child element that triggers the dialog to open */
  trigger: React.ReactElement,

  /** Data to populate the file browser table */
  data: FileBrowserData | undefined,

  /** Root path (bucket and subdirectories) of the contents */
  rootPath: string,

  /** Title that is displyed in the dialog title in the header */
  title?: string
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  trigger,
  data,
  rootPath,
  title = `Files for s3://${rootPath}`,
}) => {
  
  // Control dialog open/close state
  const [isOpen, setIsOpen] = useState(false);
  const handleOnOpenChange = (willOpen: boolean) => {
    setIsOpen(willOpen);
  }

  // Reformat the data into a structure suitable
  // for rendering to a table
  const tableData: Array<FileBrowserColumns> = []
  data?.folders.forEach((d) => {
    // Strip the file path from the name
    const newName = d.name.replace(rootPath, '')
    tableData.push({
      name: newName,
      date: d.date,
      dir: true
    })   
  })
  data?.files.forEach((d) => {
    const newName = d.name.replace(rootPath, '')
    tableData.push({
      name: newName,
      date: d.date,
      size: d.size,
      dir: false
    })
  })

  // Define up/down directory click handlers
  const [root, setRoot] = useState<string>(rootPath);
  const downDirClickHandler = (next: string) => {
    const newRoot = root + next
    setRoot(newRoot)
    console.log(newRoot)
  }
  const upDirClickHandler = () => {
    const newRoot = root.split('/').filter(Boolean).slice(0, -1).join('/') + '/'
    setRoot(newRoot)
    console.log(newRoot)
  }


  // Define columns for file display component
  const columns: Array<ColumnDef<FileBrowserColumns>> = [
    {
      accessorKey: 'name',
      meta: { alias: "Name" },
      header: ({ column }) => <SortableHeader column={column} name="Name" />,
      cell: ({ cell }) => {
        const isDir = cell.row.original.dir
        const value = cell.row.original.name
        return(
          <>
            <span 
              className="flex gap-2 items-center hover:underline hover:cursor-pointer text-primary"
              onClick={() => isDir ? downDirClickHandler(value) : ''}
            >
              <Folder className={`size-4 ${isDir ? 'opacity-100' : 'opacity-0'}`} />
              {isDir ? value.replace('/', '') : value}
            </span>
          </>
        )
      }
    },
    {
      accessorKey: 'size',
      meta: { alias: "Size" },
      header: ({ column }) => <SortableHeader column={column} name="Size" />,
      cell: ({ row }) => {
        const isDir = row.original.dir
        const size = row.original.size
        return (
          <>
            {!isDir && size != null ? formatBytes(size) : '-'}
          </>
        )
      }
    },
    {
      accessorKey: 'date',
      meta: { alias: "Modified" },
      header: ({ column }) => <SortableHeader column={column} name="Modified" />,
      cell: ({ row }) => {
        const raw = row.original.date
        const value = raw !== '-' ? new Date(raw).toLocaleString() : '-'
        return value
      }
    }
  ]
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="!max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-muted-foreground max-w-3xl text-wrap break-words whitespace-normal">
              {root !== rootPath ? `Files for s3://${root}` : title}
            </DialogTitle>
            <DialogDescription className="hidden">Browse files in bucket</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto px-2 pt-2">
            <ClientDataTable
              data={tableData}
              columns={columns}
              renderCustomRowComponent={root !== rootPath}
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
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}