import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import type { ComboBoxOption } from '@/components/combobox'
import { Stepper } from '@/components/stepper'
import { ComboBox } from '@/components/combobox'
import { useTypeOptionsLookup } from '@/components/type-options-lookup'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/projects/$project_id/actions/')({
  component: RouteComponent,
})

function RouteComponent() {

  // Stepper state
  const [activeStep, setActiveStep] = useState<number>(0);

  // Project action options & state
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

  const [projectAction, setProjectAction] = useState<{value: string, label?: string}>({
    value: '',
    label: ''
  });

  // Project platfrom options & state
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

  const [projectPlatform, setProjectPlatform] = useState<{value: string, label?: string}>({
    value: '',
    label: ''
  });

  // Project type options & state
  const [projectTypeData, setProjectTypeData] = useState<Array<any>>();
  const [projectType, setProjectType] = useState<{value: string, label?: string}>({
    value: '',
    label: ''
  });

  // Fetch type data once
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
  const projectTypeOptions = projectTypeData ? (typeOptionsLookup.lookup(projectAction.value, projectPlatform.value) ?? []) : [];

  // Concise step change handler
  const handleStepChange = (step: number, value: string, label?: string) => {
    if (step === 0) {
      setProjectAction({ value, label });
      setProjectPlatform({ value: '', label: '' });
      setProjectType({ value: '', label: '' });
      setActiveStep(value ? 1 : 0);
    } else if (step === 1) {
      setProjectPlatform({ value, label });
      setProjectType({ value: '', label: '' });
      setActiveStep(value ? 2 : 1);
    } else if (step === 2) {
      setProjectType({ value, label });
      setActiveStep(value ? 3 : 2);
    }
  };

  return (
    <>
      <div className='flex flex-col gap-12 max-w-[40rem] mt-4 mb-15'>
        <Stepper
          activeStep={activeStep}
          showFutureSteps={false}
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
                      value={projectAction.value}
                      onChange={(value: string, label?: string) => handleStepChange(0, value, label)}
                    />
                  </div>
                </>
              )
            },
            {
              label: "Select Platform",
              description: "Which platform should execute this action?",
              content: !!projectAction.value && (
                <>
                  <div className='flex flex-col flex-1'>
                    <ComboBox
                      id="projectPlatform"
                      options={projectPlatformOptions ?? []}
                      placeholder="Select project platform"
                      value={projectPlatform.value}
                      disabled={!projectAction.value}
                      onChange={(value: string, label?: string) => handleStepChange(1, value, label)}
                    />
                  </div>
                </>
              )
            },
            {
              label: "Project Type",
              description: "What type of project is this?",
              content: !!projectPlatform.value && (
                <>
                  <div className='flex flex-col flex-1 gap-4'>
                    <ComboBox
                      id="projectType"
                      options={projectTypeOptions}
                      placeholder="Select project type"
                      value={projectType.value}
                      disabled={!projectPlatform.value}
                      onChange={(value: string, label?: string) => handleStepChange(2, value, label)}
                    />
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="default"
                        disabled={!projectType.value}
                        className="flex items-center gap-2 w-full sm:w-auto"
                        onClick={() => {
                          toast.success('Project action executed successfully!');
                        }}
                      >
                        <Zap />
                        <span>Execute</span>
                      </Button>
                    </div>
                  </div>
                </>
              )
            }
          ]}
        />
      </div>
    </>
  )
}
