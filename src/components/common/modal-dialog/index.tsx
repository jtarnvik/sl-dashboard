import {Dialog, DialogBackdrop, DialogPanel, DialogTitle} from '@headlessui/react'
import {ReactNode} from "react";
import {SLButton} from "../sl-button";

type Props = {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: ReactNode
}

export function ModalDialog({onClose, isOpen, title, children}:Props) {
  return (
    <div>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <DialogBackdrop  className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 border bg-white p-6">
            <DialogTitle className="font-bold">{title}</DialogTitle>
            {children}
            <div className="w-full flex justify-end">
              <SLButton onClick={onClose}>Stäng</SLButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  ) ;
}