import {useContext} from "react";
import {RxCross2} from "react-icons/rx";
import ErrorContext from "../../contexts/error-context.ts";

export function ErrorHandler() {
  const {error, retry, setError} = useContext(ErrorContext);

  if (!error || error.length === 0) {
    return null;
  }

  function dismiss() {
    setError("");
  }

  function retryAndDismiss() {
    retry?.();
    setError("");
  }

  return (
    <div className="flex items-center px-4 py-3 bg-red-50 border border-red-200 rounded-lg shadow-sm text-gray-800"
         role="alert">
      <div className="text-sm flex items-center gap-3 flex-1">
        <span>{error}</span>
        {retry && (
          <button type="button"
                  className="text-[#184fc2] underline hover:no-underline font-medium shrink-0 cursor-pointer"
                  onClick={retryAndDismiss}
          >
            Prova igen
          </button>
        )}
      </div>
      <button type="button"
              className="ml-3 text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
              onClick={dismiss}
      >
        <RxCross2 className="w-4 h-4" />
      </button>
    </div>
  )
}