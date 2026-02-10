import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useMemo, useReducer, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type React from 'react'
import type { JSX } from 'react'
import type { PipelineAction, PipelineOption, PipelinePlatform  } from '@/client/types.gen'
import type { ComboBoxOption } from '@/components/combobox'
import { ComboBox } from '@/components/combobox'
import { Spinner } from '@/components/spinner'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getPipelineActionsOptions, getPipelinePlatformsOptions, getPipelineTypesOptions, submitPipelineJobMutation } from '@/client/@tanstack/react-query.gen'

interface ExecuteActionFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Project ID for pipeline submission */
  projectId: string
}

export const ExecuteActionForm: React.FC<ExecuteActionFormProps> = ({
  trigger,
  projectId
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  // Stepper state managed by useReducer
  type State = {
    activeStep: number;
    projectAction: { value: PipelineAction | ''; label?: string };
    projectPlatform: { value: PipelinePlatform | ''; label?: string };
    projectType: { value: string; label?: string };
    autoRelease: boolean;
  };
  type Action =
    | { type: 'SET_ACTION'; value: PipelineAction; label?: string }
    | { type: 'SET_PLATFORM'; value: PipelinePlatform; label?: string }
    | { type: 'SET_TYPE'; value: string; label?: string }
    | { type: 'SET_ACTIVE_STEP'; value: number }
    | { type: 'SET_AUTO_RELEASE'; value: boolean };

  const initialState: State = {
    activeStep: 0,
    projectAction: { value: '' as PipelineAction, label: '' },
    projectPlatform: { value: '' as PipelinePlatform, label: '' },
    projectType: { value: '', label: '' },
    autoRelease: false,
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_ACTION':
        return {
          ...state,
          projectAction: { value: action.value, label: action.label },
          projectPlatform: { value: '' as PipelinePlatform, label: '' },
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
      case 'SET_AUTO_RELEASE':
        return {
          ...state,
          autoRelease: action.value,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  // Setup mutation for submitting pipeline job
  const submitPipelineJob = useMutation({
    ...submitPipelineJobMutation(),
    onSuccess: (data) => {
      toast.success('Pipeline job submitted successfully!', {
        description: (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-mono text-foreground">{data.id}</span>
          </div>
        ),
      });
      // Give user time to see the completed state before closing
      setTimeout(() => {
        setSheetOpen(false);
        // Ensure state is cleared after the sheet closes
        setTimeout(() => handleReset(), 300);
      }, 700);
    },
    onError: (error) => {
      toast.error('Failed to submit pipeline job', {
        description: (
          <span className="text-sm text-foreground">{error.message || 'An unexpected error occurred'}</span>
        ),
      });
    },
  });

  // Handle reset - clear form state
  const handleReset = () => {
    dispatch({ type: 'SET_ACTION', value: '' as PipelineAction, label: '' });
    dispatch({ type: 'SET_ACTIVE_STEP', value: 0 });
    dispatch({ type: 'SET_AUTO_RELEASE', value: false });
  };

  // Handle sheet open/close - clear state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleReset();
    }
  };

  // Project action options
  const { data: projectActionsData } = useQuery(getPipelineActionsOptions());
  const projectActionOptions = useMemo<Array<ComboBoxOption>>(() => {
    return (projectActionsData)?.map(option => ({
      value: option.value,
      label: option.label,
      description: option.description,
    })) ?? [];
  }, [projectActionsData]);

  // Project platform options
  const { data: projectPlatformsData } = useQuery(getPipelinePlatformsOptions());
  const projectPlatformOptions = useMemo<Array<ComboBoxOption>>(() => {
    return (projectPlatformsData ?? []).map(option => ({
      value: option.value,
      label: option.label,
      description: option.description,
    }));
  }, [projectPlatformsData]);

  // Project type options
  const { data: projectTypesData, isFetching: isLoadingProjectTypes } = useQuery({
    ...getPipelineTypesOptions({
      query: {
        action: state.projectAction.value as PipelineAction,
        platform: state.projectPlatform.value as PipelinePlatform,
      },
    }),
    enabled: !!state.projectAction.value && !!state.projectPlatform.value,
  });
  const projectTypeOptions = useMemo<Array<ComboBoxOption>>(() => {
    return (projectTypesData as Array<PipelineOption> | undefined)?.map(option => ({
      value: option.label, // Use label as unique identifier since values can be duplicated
      label: option.label,
      description: option.description,
    })) ?? [];
  }, [projectTypesData]);

  return (
    <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); handleOpenChange(open); }}>
      <SheetTrigger asChild onClick={() => setSheetOpen(true)}>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Execute Action</SheetTitle>
          <SheetDescription>
            Execute pipelines and actions on this project
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
                        options={projectActionOptions}
                        placeholder="Select project action"
                        value={state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_ACTION', value: value as PipelineAction, label })}
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
                        options={projectPlatformOptions}
                        placeholder="Select project platform"
                        value={state.projectPlatform.value}
                        disabled={!state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_PLATFORM', value: value as PipelinePlatform, label })}
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
                      {isLoadingProjectTypes ? (
                        <div className="flex items-center gap-2 border rounded-md py-2 px-2 text-sm text-muted-foreground">
                          <Spinner variant="circle" size={16} />
                          <span>Loading project types...</span>
                        </div>
                      ) : (
                        <>
                          <ComboBox
                            id="projectType"
                            options={projectTypeOptions}
                            placeholder="Select project type"
                            value={state.projectType.value}
                            disabled={!state.projectPlatform.value}
                            onChange={(value: string, label?: string) => dispatch({ type: 'SET_TYPE', value, label })}
                          />
                          {state.projectAction.value === 'export-project-results' && state.projectType.value && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="autoRelease"
                                checked={state.autoRelease}
                                onCheckedChange={(checked) => dispatch({ type: 'SET_AUTO_RELEASE', value: checked as boolean })}
                              />
                              <Label
                                htmlFor="autoRelease"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Auto-release Xpress Project
                              </Label>
                            </div>
                          )}
                        </>
                      )}
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
            disabled={!state.projectType.value || submitPipelineJob.isPending}
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={() => {
              const projectType = (state.projectType.label || state.projectType.value).split(':')[0].trim();
              const reference = state.projectType.label || state.projectType.value;

              console.log('Submitting pipeline job with:', {
                action: state.projectAction.value,
                platform: state.projectPlatform.value,
                project_type: projectType,
                reference,
                auto_release: state.autoRelease,
              });
              
              submitPipelineJob.mutate({
                path: {
                  project_id: projectId,
                },
                body: {
                  action: state.projectAction.value as PipelineAction,
                  platform: state.projectPlatform.value as PipelinePlatform,
                  project_type: projectType,
                  reference: reference,
                  auto_release: state.autoRelease,
                },
              });
            }}
          >
            {submitPipelineJob.isPending ? (
              <Spinner variant="circle" size={16} />
            ) : (
              <Zap />
            )}
            <span>{submitPipelineJob.isPending ? 'Submitting...' : 'Execute'}</span>
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
