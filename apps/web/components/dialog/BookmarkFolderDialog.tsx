import { useContext, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

import { useOpenItem } from "@refeed/features/item/useItemDataWeb";
import { Input } from "@refeed/ui";
import {
  ContentTopBar,
  DialogOpenContext,
  dialogVariants,
  getEnsureDialogContainer,
} from "@refeed/ui/components/dialog/AddDialog";

import { useUpdateBookmarkFolders } from "../../features/bookmarks/useUpdateBookmarkFolders";
import { cn } from "../../lib/cnutils";

interface ExtendedProps extends RadixDialog.DialogContentProps {
  link?: string;
}

export function BookmarkFolderDialog({ className, ...props }: ExtendedProps) {
  const isOpen = useContext(DialogOpenContext);

  const { openItem } = useOpenItem();
  const [folderName, setFolderName] = useState<string | undefined>();
  const { toggleBookmarkFolder } = useUpdateBookmarkFolders();

  return (
    <>
      {isOpen && (
        <RadixDialog.Portal forceMount container={getEnsureDialogContainer()}>
          <RadixDialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.2,
              }}
              className="fixed inset-0 z-50 bg-neutral-600/20"
            />
          </RadixDialog.Overlay>
          <AnimatePresence>
            <RadixDialog.Content
              forceMount
              asChild
              className={cn(
                "fixed z-50 grid w-[300px] gap-4 rounded-b-lg bg-white shadow-[0_0px_0px_1.25px_rgba(31,34,37,0.09),0px_12px_24px_-4px_rgba(0,0,0,0.08),0_4px_10px_rgba(166,166,166,0.16)] fade-in-100 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 dark:bg-[#0f0f10] dark:shadow-md",
                className,
              )}
              {...props}
            >
              <motion.div
                variants={dialogVariants}
                initial="closed"
                animate="open"
                exit="closed"
                layout
                layoutId="addDialog"
              >
                <ContentTopBar title={props.title} />
                <motion.div className="flex h-full w-[300px] flex-col items-stretch px-3.5 pb-2">
                  <Input
                    onChange={(e) => {
                      setFolderName(e.target.value);
                    }}
                    placeholder="Folder Name"
                  />
                  <>
                    <RadixDialog.Close aria-label="Close">
                      <motion.button
                        layout="preserve-aspect"
                        onClick={() => {
                          if (folderName && openItem) {
                            toggleBookmarkFolder(openItem, folderName);
                          }
                        }}
                        className={`-z-10 mb-1 mt-4 w-full ${
                          !folderName
                            ? "cursor-not-allowed bg-sky-500/60"
                            : "bg-sky-500"
                        } rounded-md py-1.5 text-center font-medium tracking-tight text-white`}
                      >
                        Create Folder
                      </motion.button>
                    </RadixDialog.Close>
                  </>
                </motion.div>
              </motion.div>
            </RadixDialog.Content>
          </AnimatePresence>
        </RadixDialog.Portal>
      )}
    </>
  );
}
