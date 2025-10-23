"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { User, Globe, GraduationCap, Moon, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/contexts/LanguageContext"

interface DemographicsData {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  culturalBackground?: 'turkish' | 'western' | 'eastern' | 'mixed' | 'other';
  educationLevel?: 'elementary' | 'secondary' | 'university' | 'graduate' | 'unknown';
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
  stressLevel?: 'low' | 'moderate' | 'high' | 'unknown';
}

interface DemographicsFormProps {
  onComplete: (data: DemographicsData) => void;
  onSkip: () => void;
  isOptional?: boolean;
}

export function DemographicsForm({ onComplete, onSkip, isOptional = true }: DemographicsFormProps) {
  const { t } = useTranslation();
  const [demographics, setDemographics] = useState<DemographicsData>({});
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => [
    {
      key: 'age',
      title: t('demographics.steps.age.title'),
      description: t('demographics.steps.age.description'),
      icon: User,
      options: ['20', '30', '40', '50', '60', '70'].map(value => ({
        value,
        label: t(`demographics.steps.age.options.${value}`)
      })),
    },
    {
      key: 'gender',
      title: t('demographics.steps.gender.title'),
      description: t('demographics.steps.gender.description'),
      icon: User,
      options: ['female', 'male', 'other', 'prefer_not_to_say'].map(value => ({
        value,
        label: t(`demographics.steps.gender.options.${value}`)
      })),
    },
    {
      key: 'culturalBackground',
      title: t('demographics.steps.culturalBackground.title'),
      description: t('demographics.steps.culturalBackground.description'),
      icon: Globe,
      options: ['turkish', 'western', 'eastern', 'mixed', 'other'].map(value => ({
        value,
        label: t(`demographics.steps.culturalBackground.options.${value}`)
      })),
    },
    {
      key: 'educationLevel',
      title: t('demographics.steps.educationLevel.title'),
      description: t('demographics.steps.educationLevel.description'),
      icon: GraduationCap,
      options: ['elementary', 'secondary', 'university', 'graduate', 'unknown'].map(value => ({
        value,
        label: t(`demographics.steps.educationLevel.options.${value}`)
      })),
    },
    {
      key: 'sleepQuality',
      title: t('demographics.steps.sleepQuality.title'),
      description: t('demographics.steps.sleepQuality.description'),
      icon: Moon,
      options: ['excellent', 'good', 'fair', 'poor', 'unknown'].map(value => ({
        value,
        label: t(`demographics.steps.sleepQuality.options.${value}`)
      })),
    },
    {
      key: 'stressLevel',
      title: t('demographics.steps.stressLevel.title'),
      description: t('demographics.steps.stressLevel.description'),
      icon: Activity,
      options: ['low', 'moderate', 'high', 'unknown'].map(value => ({
        value,
        label: t(`demographics.steps.stressLevel.options.${value}`)
      })),
    },
  ], [t]);


  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleSelect = (value: string) => {
    const key = currentStepData.key as keyof DemographicsData;
    
    setDemographics(prev => ({
      ...prev,
      [key]: key === 'age' ? parseInt(value) : value
    }));

    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    } else {
      setTimeout(() => {
        onComplete({
          ...demographics,
          [key]: key === 'age' ? parseInt(value) : value
        });
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <motion.div
            key={currentStep}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center mb-4"
          >
             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Icon className="w-8 h-8 text-white" />
              </div>
          </motion.div>
          
          <CardTitle className="text-2xl text-white">
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-white/70">
            {currentStepData.description}
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mt-4">
            <motion.div
                className="bg-gradient-to-r from-white/30 to-white/60 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="text-sm text-white/60 mt-2">
            {currentStep + 1} / {steps.length}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-3"
          >
            {currentStepData.options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(option.value)}
                className="w-full p-4 text-left bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-white/40 transition-all text-white group"
              >
                <div className="flex items-center justify-between">
                  <span className="group-hover:text-purple-200 transition-colors">
                    {option.label}
                  </span>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="w-6 h-6 rounded-full border-2 border-white/40 group-hover:border-purple-300 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-purple-300 transition-colors" />
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t('demographics.back')}
            </Button>

            {isOptional && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('demographics.skip')}
              </Button>
            )}
          </div>

          {isOptional && (
            <div className="text-center text-sm text-white/60 mt-4">
              <p>{t('demographics.optionalMessage')}</p>
              <p>{t('demographics.skipMessage')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 