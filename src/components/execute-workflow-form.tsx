import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useReducer, useState } from 'react'
import type React from 'react'
import type { JSX } from 'react'
import type { ComboBoxOption } from '@/components/combobox'
import { ComboBox } from '@/components/combobox'
import { Stepper } from '@/components/stepper'
import { useTypeOptionsLookup } from '@/components/type-options-lookup'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface ExecuteWorkflowFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
}

export const ExecuteWorkflowForm: React.FC<ExecuteWorkflowFormProps> = ({
  trigger
}) => {
  // Stepper state managed by useReducer
  type State = {
    activeStep: number;
    projectAction: { value: string; label?: string };
    projectPlatform: { value: string; label?: string };
    projectType: { value: string; label?: string };
  };
  type Action =
    | { type: 'SET_ACTION'; value: string; label?: string }
    | { type: 'SET_PLATFORM'; value: string; label?: string }
    | { type: 'SET_TYPE'; value: string; label?: string }
    | { type: 'SET_ACTIVE_STEP'; value: number };

  const initialState: State = {
    activeStep: 0,
    projectAction: { value: '', label: '' },
    projectPlatform: { value: '', label: '' },
    projectType: { value: '', label: '' },
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_ACTION':
        return {
          ...state,
          projectAction: { value: action.value, label: action.label },
          projectPlatform: { value: '', label: '' },
          projectType: { value: '', label: '' },
          activeStep: action.value ? 1 : 0,
        };
      case 'SET_PLATFORM':
        return {
          ...state,
          projectPlatform: { value: action.value, label: action.label },
          projectType: { value: '', label: '' },
          activeStep: action.value ? 2 : 1,
        };
      case 'SET_TYPE':
        return {
          ...state,
          projectType: { value: action.value, label: action.label },
          activeStep: action.value ? 3 : 2,
        };
      case 'SET_ACTIVE_STEP':
        return {
          ...state,
          activeStep: action.value,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  // Handle reset - clear form state
  const handleReset = () => {
    dispatch({ type: 'SET_ACTION', value: '', label: '' });
    dispatch({ type: 'SET_ACTIVE_STEP', value: 0 });
  };

  // Handle sheet open/close - clear state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleReset();
    }
  };

  // Project action options
  const [projectActionOptions, setProjectActionOptions] = useState<Array<ComboBoxOption>>();
  useEffect(() => {
    const fetchProjectActionOptions = async () => {
      const res = await fetch('/data/example_options_project_actions.json')
      if (!res.ok) {
        throw new Error('Unable to fetch project action options')
      }
      const options = await res.json()
      setProjectActionOptions(options)
    }
    fetchProjectActionOptions()
  }, [])

  // Project platform options
  const [projectPlatformOptions, setProjectPlatformOptions] = useState<Array<ComboBoxOption>>();
  useEffect(() => {
    const fetchProjectPlatformOptions = async () => {
      const res = await fetch('/data/example_options_project_platforms.json')
      if (!res.ok) {
        throw new Error('Unable to fetch project platform options')
      }
      const options = await res.json()
      setProjectPlatformOptions(options)
    }
    fetchProjectPlatformOptions()
  }, [])

  // Project type options
  const [projectTypeData, setProjectTypeData] = useState<Array<any>>();
  useEffect(() => {
    const fetchProjectTypeData = async () => {
      const res = await fetch('/data/example_options_project_type_data.json')
      if (!res.ok) {
        throw new Error('Unable to fetch project type options')
      }
      const entries = await res.json()
      setProjectTypeData(entries)
    }
    fetchProjectTypeData()
  }, [])

  // Memoize lookup function, always call hooks unconditionally
  const typeOptionsLookup = useTypeOptionsLookup(projectTypeData ?? []);
  const projectTypeOptions = projectTypeData ? (typeOptionsLookup.lookup(state.projectAction.value, state.projectPlatform.value) ?? []) : [];

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Execute Workflow</SheetTitle>
          <SheetDescription>
            Execute workflows and actions on this project
          </SheetDescription>
        <div className='flex flex-col gap-12 mt-6'>
          <Stepper
            activeStep={state.activeStep}
            showFutureSteps={true}
            steps={[
              {
                label: "Choose Action",
                description: "Which action would you like to perform?",
                content: (
                  <>
                    <div className='flex flex-col flex-1'>
                      <ComboBox
                        id="projectAction"
                        options={projectActionOptions ?? []}
                        placeholder="Select project action"
                        value={state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_ACTION', value, label })}
                      />
                    </div>
                  </>
                )
              },
              {
                label: "Select Platform",
                description: "Which platform should execute this action?",
                content: (
                  <>
                    <div className='flex flex-col flex-1'>
                      <ComboBox
                        id="projectPlatform"
                        options={projectPlatformOptions ?? []}
                        placeholder="Select project platform"
                        value={state.projectPlatform.value}
                        disabled={!state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_PLATFORM', value, label })}
                      />
                    </div>
                  </>
                )
              },
              {
                label: "Project Type",
                description: "What type of project is this?",
                content: (
                  <>
                    <div className='flex flex-col flex-1 gap-4'>
                      <ComboBox
                        id="projectType"
                        options={projectTypeOptions}
                        placeholder="Select project type"
                        value={state.projectType.value}
                        disabled={!state.projectPlatform.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_TYPE', value, label })}
                      />
                    </div>  
                  </>
                )
              }
            ]}
          />
        </div>
        </SheetHeader>
        <SheetFooter>
          <Button
            variant="default"
            disabled={!state.projectType.value}
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={() => {
              toast.success('Project action executed successfully!');
            }}
          >
            <Zap />
            <span>Execute</span>
          </Button>
          <SheetClose asChild>
            <Button
              variant='secondary'
              onClick={handleReset}
            >
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
