import {useContext} from "react";
import ErrorContext from "../../contexts/error-context.ts";

export function ErrorHandler() {
  const {error, setError} = useContext(ErrorContext);

  if (!error || error.length === 0) {
    return null;
  }

  // Todo: make alert component
  return (
    <div className="flex items-center p-4 text-red-800 border-t-4 border-red-300 bg-red-50 rounded-lg"
         role="alert">
      <div className="ms-3 text-sm font-medium">
        {error}
      </div>
      <button type="button"
              className="ms-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8 "
              onClick={() => setError("")}
      >
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
      </button>
    </div>
  )
}