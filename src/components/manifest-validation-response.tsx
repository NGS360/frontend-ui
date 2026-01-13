import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ManifestValidationResponse } from '@/client/types.gen'
import { Card } from '@/components/ui/card'

interface ManifestValidationResponseDisplayProps {
  response?: ManifestValidationResponse | null
}

export const ManifestValidationResponseDisplay: React.FC<ManifestValidationResponseDisplayProps> = ({
  response,
}) => {
  if (!response) {
    return <div className="text-muted-foreground">No validation response available</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className={`p-4 rounded-lg border-none shadow-none ${
        response.valid 
          ? 'bg-green-50'
          : 'bg-red-50'
      }`}>
        <div className="flex items-center gap-3">
          {response.valid ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <span className={`font-semibold text-base ${response.valid ? 'text-green-900' : 'text-red-900'}`}>
            {response.valid ? 'Manifest is valid' : 'Manifest is invalid'}
          </span>
        </div>
      </Card>

      {response.message && Object.keys(response.message).length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm">Messages</h4>
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            {Object.entries(response.message).map(([key, value]) => (
              <div key={key} className="text-muted-foreground">
                <span className="font-medium">{key}:</span> {value}
              </div>
            ))}
          </div>
        </div>
      )}

      {response.error && Object.keys(response.error).length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm text-red-600">Errors</h4>
          <div className="bg-red-50 p-3 rounded-md text-sm space-y-2">
            {Object.entries(response.error).map(([category, errors]) => (
              <div key={category}>
                <span className="font-medium text-red-700">{category}</span>
                <ul className="list-disc list-inside ml-2 text-red-600">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {response.warning && Object.keys(response.warning).length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm text-yellow-600">Warnings</h4>
          <div className="bg-yellow-50 p-3 rounded-md text-sm space-y-2">
            {Object.entries(response.warning).map(([category, warnings]) => (
              <div key={category}>
                <span className="font-medium text-yellow-700">{category}</span>
                <ul className="list-disc list-inside ml-2 text-yellow-600">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}