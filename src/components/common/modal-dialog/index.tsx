import {Dialog, DialogBackdrop, DialogPanel, DialogTitle} from '@headlessui/react'
import {ReactNode} from "react";
import {SLButton} from "../sl-button";

type Props = {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: ReactNode,
  scrollable?: boolean
}

export function ModalDialog({onClose, isOpen, title, children, scrollable = false}: Props) {
  let scrollabelDiv1 = "fixed inset-0 flex w-screen items-center justify-center p-4";
  let scrollabelDiv2 = "";

  if (scrollable) {
    scrollabelDiv1 = "fixed inset-0 w-screen overflow-y-auto p-4";
    scrollabelDiv2 = "flex min-h-full items-center justify-center";
  }
  return (
    <div>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className={scrollabelDiv1}>
          <div className={scrollabelDiv2}>
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-6">
              <DialogTitle className="font-bold">{title}</DialogTitle>
              {children}
              <div className="w-full flex justify-end">
                <SLButton onClick={onClose}>Stäng</SLButton>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}