import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useId, useMemo, useReducer, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type React from 'react'
import type { JSX } from 'react'
import type { ActionOption, ActionPlatform  } from '@/client/types.gen'
import type { ComboBoxOption } from '@/components/combobox'
import { ComboBox } from '@/components/combobox'
import { Spinner } from '@/components/spinner'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getActionOptionsOptions, getActionPlatformsOptions, getActionTypesOptions, submitPipelineJobMutation } from '@/client/@tanstack/react-query.gen'
import { useInvalidateJobQueries, useViewJob } from '@/hooks/use-job-queries'

interface ExecuteActionFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Project ID for pipeline submission */
  projectId: string
  /** Optional DOM id prefix for this form instance */
  idPrefix?: string
}

export const ExecuteActionForm: React.FC<ExecuteActionFormProps> = ({
  trigger,
  projectId,
  idPrefix,
}) => {
  const generatedId = useId();
  const baseId = (idPrefix || `execute-action-${projectId}-${generatedId.replace(/:/g, '')}`).replace(/[^a-zA-Z0-9_-]+/g, '-');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { invalidateJobQueries } = useInvalidateJobQueries();
  const { viewJob } = useViewJob();
  // Stepper state managed by useReducer
  type State = {
    activeStep: number;
    projectAction: { value: ActionOption | ''; label?: string };
    projectPlatform: { value: ActionPlatform | ''; label?: string };
    projectType: { value: string; label?: string };
    autoRelease: boolean;
  };
  type Action =
    | { type: 'SET_ACTION'; value: ActionOption | ''; label?: string }
    | { type: 'SET_PLATFORM'; value: ActionPlatform | ''; label?: string }
    | { type: 'SET_TYPE'; value: string; label?: string }
    | { type: 'SET_ACTIVE_STEP'; value: number }
    | { type: 'SET_AUTO_RELEASE'; value: boolean };

  const initialState: State = {
    activeStep: 0,
    projectAction: { value: '', label: '' },
    projectPlatform: { value: '', label: '' },
    projectType: { value: '', label: '' },
    autoRelease: false,
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_ACTION':
        return {
          ...state,
          projectAction: { value: action.value, label: action.label },
          projectPlatform: { value: '', label: '' },
          projectType: { value: '', label: '' },
          activeStep: action.value !== '' ? 1 : 0,
        };
      case 'SET_PLATFORM':
        return {
          ...state,
          projectPlatform: { value: action.value, label: action.label },
          projectType: { value: '', label: '' },
          activeStep: action.value !== '' ? 2 : 1,
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
      invalidateJobQueries();

      toast.success('Project action submitted successfully', {
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => viewJob(data.id)}
              >
                View Job
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => toast.dismiss()}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ),
      });

      setSheetOpen(false);
      handleReset();
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
    dispatch({ type: 'SET_ACTION', value: '', label: '' });
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
  const { data: projectActionsData } = useQuery(getActionOptionsOptions());
  const projectActionOptions = useMemo<Array<ComboBoxOption>>(() => {
    return (projectActionsData ?? []).map(option => ({
      value: option.value,
      label: option.label,
      description: option.description,
    }));
  }, [projectActionsData]);

  // Project platform options
  const { data: projectPlatformsData } = useQuery(getActionPlatformsOptions());
  const projectPlatformOptions = useMemo<Array<ComboBoxOption>>(() => {
    return (projectPlatformsData ?? []).map(option => ({
      value: option.value,
      label: option.label,
      description: option.description,
    }));
  }, [projectPlatformsData]);

  // Project type options
  const { data: projectTypesData, isFetching: isLoadingProjectTypes } = useQuery({
    ...getActionTypesOptions({
      query: {
        action: state.projectAction.value as ActionOption,
        platform: state.projectPlatform.value as ActionPlatform,
      },
    }),
    enabled: !!state.projectAction.value && !!state.projectPlatform.value,
  });
  const projectTypeOptions = useMemo<Array<ComboBoxOption>>(() => {
    if (!projectTypesData) return [];
    return (projectTypesData as Array<{ label: string; value: string; description: string }>).map(option => ({
      value: option.label, // Use label as unique identifier since values can be duplicated
      label: option.label,
      description: option.description,
    }));
  }, [projectTypesData]);

  return (
    <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); handleOpenChange(open); }}>
      <SheetTrigger asChild onClick={() => setSheetOpen(true)}>{trigger}</SheetTrigger>
      <SheetContent id={`${baseId}-sheet`} srTitle="Execute Action" side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle id={`${baseId}-title`}>Execute Action</SheetTitle>
          <SheetDescription>
            Execute pipelines and actions on this project
          </SheetDescription>
        <div id={`${baseId}-stepper`} className='flex flex-col gap-12 mt-6'>
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
                        id={`${baseId}-project-action`}
                        options={projectActionOptions}
                        placeholder="Select project action"
                        value={state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_ACTION', value: value as ActionOption, label })}
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
                        id={`${baseId}-project-platform`}
                        options={projectPlatformOptions}
                        placeholder="Select project platform"
                        value={state.projectPlatform.value}
                        disabled={!state.projectAction.value}
                        onChange={(value: string, label?: string) => dispatch({ type: 'SET_PLATFORM', value: value as ActionPlatform, label })}
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
                            id={`${baseId}-project-type`}
                            options={projectTypeOptions}
                            placeholder="Select project type"
                            value={state.projectType.value}
                            disabled={!state.projectPlatform.value}
                            onChange={(value: string, label?: string) => dispatch({ type: 'SET_TYPE', value, label })}
                          />
                          {state.projectAction.value === 'export-project-results' && state.projectType.value && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${baseId}-auto-release`}
                                checked={state.autoRelease}
                                onCheckedChange={(checked) => dispatch({ type: 'SET_AUTO_RELEASE', value: checked as boolean })}
                              />
                              <Label
                                htmlFor={`${baseId}-auto-release`}
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
            id={`${baseId}-submit`}
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
                  action: state.projectAction.value as ActionOption,
                  platform: state.projectPlatform.value as ActionPlatform,
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
              id={`${baseId}-close`}
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
