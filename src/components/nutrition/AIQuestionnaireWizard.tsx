import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brain, Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";

interface AIQuestionnaireWizardProps {
  onComplete: (planData: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const STEPS = [
  { id: 'user', title: 'Χρήστης' },
  { id: 'goal', title: 'Στόχος' },
  { id: 'preferences', title: 'Προτιμήσεις' },
  { id: 'allergies', title: 'Αλλεργίες' },
  { id: 'health', title: 'Υγεία' },
  { id: 'generate', title: 'Δημιουργία' },
];

const GOALS = [
  { value: 'weight_loss', label: 'Απώλεια Βάρους', description: 'Θερμιδικό έλλειμμα για απώλεια λίπους' },
  { value: 'muscle_gain', label: 'Αύξηση Μυϊκής Μάζας', description: 'Θερμιδικό πλεόνασμα για μυϊκή ανάπτυξη' },
  { value: 'maintenance', label: 'Διατήρηση', description: 'Σταθερό βάρος και σύσταση σώματος' },
  { value: 'performance', label: 'Απόδοση', description: 'Βελτιστοποίηση για αθλητική απόδοση' },
];

const ALLERGIES = [
  { value: 'gluten', label: 'Γλουτένη' },
  { value: 'lactose', label: 'Λακτόζη' },
  { value: 'nuts', label: 'Ξηροί καρποί' },
  { value: 'eggs', label: 'Αυγά' },
  { value: 'fish', label: 'Ψάρια/Θαλασσινά' },
  { value: 'soy', label: 'Σόγια' },
];

const PREFERENCES = [
  { value: 'vegetarian', label: 'Χορτοφαγία' },
  { value: 'vegan', label: 'Αυστηρή Χορτοφαγία (Vegan)' },
  { value: 'mediterranean', label: 'Μεσογειακή Διατροφή' },
  { value: 'low_carb', label: 'Χαμηλοί Υδατάνθρακες' },
  { value: 'high_protein', label: 'Υψηλή Πρωτεΐνη' },
];

export const AIQuestionnaireWizard: React.FC<AIQuestionnaireWizardProps> = ({
  onComplete,
  onCancel,
  loading
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const { effectiveCoachId, loading: rolesLoading } = useEffectiveCoachId();

  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    goal: '',
    preferences: [] as string[],
    allergies: [] as string[],
    additionalNotes: '',
    mealsPerDay: 5,
    // User data from anthropometric
    weight: '',
    height: '',
    age: '',
    activityLevel: 'moderate',
    trainingVolume: '',
    // Health data
    hasDiabetes: false,
    diabetesType: '',
    medications: ''
  });

  useEffect(() => {
    if (rolesLoading) return;
    fetchUsers();
  }, [rolesLoading, effectiveCoachId]);

  const fetchUsers = async () => {
    try {
      if (!effectiveCoachId) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, birth_date, avatar_url, photo_url')
        .eq('coach_id', effectiveCoachId)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      let weight = '';
      let height = '';

      // First try regular anthropometric tables
      const { data: anthroData } = await supabase
        .from('anthropometric_test_sessions')
        .select(`
          *,
          anthropometric_test_data (weight, height)
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anthroData?.anthropometric_test_data?.[0]) {
        const data = anthroData.anthropometric_test_data[0];
        weight = data.weight?.toString() || '';
        height = data.height?.toString() || '';
      }

      // If no data found, try coach anthropometric tables
      if (!weight && !height && effectiveCoachId) {
        const { data: coachAnthroData } = await supabase
          .from('coach_anthropometric_test_sessions')
          .select(`
            *,
            coach_anthropometric_test_data (weight, height)
          `)
          .eq('user_id', userId)
          .eq('coach_id', effectiveCoachId)
          .order('test_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (coachAnthroData?.coach_anthropometric_test_data?.[0]) {
          const data = coachAnthroData.coach_anthropometric_test_data[0];
          weight = data.weight?.toString() || '';
          height = data.height?.toString() || '';
        }
      }

      // Calculate age from birth_date
      const user = users.find(u => u.id === userId);
      let age = '';
      if (user?.birth_date) {
        const birthDate = new Date(user.birth_date);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge.toString();
      }

      setFormData(prev => ({
        ...prev,
        weight,
        height,
        age
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      userId,
      userName: user?.name || ''
    }));
    fetchUserData(userId);
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const calculateCalories = () => {
    const weight = parseFloat(formData.weight) || 70;
    const height = parseFloat(formData.height) || 170;
    const age = parseInt(formData.age) || 30;
    
    // Harris-Benedict equation (simplified)
    let bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Male equation
    
    // Activity multiplier
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    let tdee = bmr * (activityMultipliers[formData.activityLevel] || 1.55);
    
    // Adjust for goal
    if (formData.goal === 'weight_loss') {
      tdee *= 0.85; // 15% deficit
    } else if (formData.goal === 'muscle_gain') {
      tdee *= 1.1; // 10% surplus
    }
    
    return Math.round(tdee);
  };

  const generatePlan = async () => {
    setGenerating(true);
    
    try {
      const totalCalories = calculateCalories();
      const proteinTarget = Math.round(parseFloat(formData.weight) * 2) || 140; // 2g per kg
      const fatTarget = Math.round(totalCalories * 0.25 / 9); // 25% of calories from fat
      const carbsTarget = Math.round((totalCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4);

      // Call AI to generate plan
      const { data, error } = await supabase.functions.invoke('generate-nutrition-plan', {
        body: {
          userId: formData.userId,
          userName: formData.userName,
          goal: formData.goal,
          preferences: formData.preferences,
          allergies: formData.allergies,
          totalCalories,
          proteinTarget,
          carbsTarget,
          fatTarget,
          mealsPerDay: formData.mealsPerDay,
          additionalNotes: formData.additionalNotes
        }
      });

      if (error) throw error;

      if (data?.plan) {
        // Ensure coachId is always present for DB insert + RLS
        onComplete({
          ...data.plan,
          coachId: effectiveCoachId,
        });
      } else {
        // Fallback: create a basic template
        const goalLabel = GOALS.find(g => g.value === formData.goal)?.label || 'Γενικό';
        const planData = {
          name: `Πρόγραμμα ${goalLabel} - ${formData.userName}`,
          description: `Εβδομαδιαίο πρόγραμμα διατροφής για ${formData.userName}`,
          goal: formData.goal,
          totalCalories,
          proteinTarget,
          carbsTarget,
          fatTarget,
          coachId: effectiveCoachId,
          days: generateWeekTemplate(totalCalories, proteinTarget, carbsTarget, fatTarget)
        };
        onComplete(planData);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Σφάλμα κατά τη δημιουργία. Δημιουργείται βασικό πρότυπο...');
      
      // Fallback template
      const totalCalories = calculateCalories();
      const proteinTarget = Math.round(parseFloat(formData.weight) * 2) || 140;
      const fatTarget = Math.round(totalCalories * 0.25 / 9);
      const carbsTarget = Math.round((totalCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4);
      
      const goalLabel = GOALS.find(g => g.value === formData.goal)?.label || 'Γενικό';
      const planData = {
        name: `Πρόγραμμα ${goalLabel} - ${formData.userName}`,
        description: `Εβδομαδιαίο πρόγραμμα διατροφής για ${formData.userName}`,
        goal: formData.goal,
        totalCalories,
        proteinTarget,
        carbsTarget,
        fatTarget,
        coachId: effectiveCoachId,
        days: generateWeekTemplate(totalCalories, proteinTarget, carbsTarget, fatTarget)
      };
      onComplete(planData);
    } finally {
      setGenerating(false);
    }
  };

  const generateWeekTemplate = (calories: number, protein: number, carbs: number, fat: number) => {
    const dayNames = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
    const mealTypes = [
      { type: 'breakfast', name: 'Πρωινό', order: 1 },
      { type: 'morning_snack', name: 'Δεκατιανό', order: 2 },
      { type: 'lunch', name: 'Μεσημεριανό', order: 3 },
      { type: 'afternoon_snack', name: 'Απογευματινό', order: 4 },
      { type: 'dinner', name: 'Βραδινό', order: 5 },
    ];

    return dayNames.map((name, index) => ({
      dayNumber: index + 1,
      name,
      totalCalories: calories,
      totalProtein: protein,
      totalCarbs: carbs,
      totalFat: fat,
      meals: mealTypes.map(meal => ({
        type: meal.type,
        order: meal.order,
        name: meal.name,
        description: '',
        totalCalories: Math.round(calories / 5),
        totalProtein: Math.round(protein / 5),
        totalCarbs: Math.round(carbs / 5),
        totalFat: Math.round(fat / 5),
        foods: []
      }))
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!formData.userId;
      case 1: return !!formData.goal;
      case 2: return true; // Preferences are optional
      case 3: return true; // Allergies are optional
      case 4: return true; // Health info optional
      default: return true;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Progress header - sticky on mobile */}
      <div className="shrink-0 space-y-3 pb-4">
        <Progress value={progress} className="h-2" />

        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`px-2 sm:px-3 py-1 rounded-none text-[10px] sm:text-xs ${
                index === currentStep
                  ? 'bg-[#00ffba] text-black font-medium'
                  : index < currentStep
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-4">
        {/* Step 0: User Selection */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Επιλέξτε Χρήστη</h3>
            <div className="grid gap-2 max-h-[40vh] sm:max-h-[300px] overflow-y-auto">
              {users.map(user => (
                <Card
                  key={user.id}
                  className={`rounded-none cursor-pointer transition-colors ${
                    formData.userId === user.id 
                      ? 'border-[#00ffba] bg-[#00ffba]/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="w-8 h-8 rounded-full">
                      <AvatarImage src={user.photo_url || user.avatar_url} />
                      <AvatarFallback className="rounded-full bg-[#cb8954] text-white text-sm">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {formData.userId && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="space-y-2">
                  <Label>Βάρος (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ύψος (cm)</Label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ηλικία</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="rounded-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Goal */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Επιλέξτε Στόχο</h3>
            <RadioGroup value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
              {GOALS.map(goal => (
                <div key={goal.value} className="flex items-center space-x-3 p-3 border rounded-none hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value={goal.value} id={goal.value} />
                  <Label htmlFor={goal.value} className="flex-1 cursor-pointer">
                    <div className="font-medium">{goal.label}</div>
                    <div className="text-xs text-gray-500">{goal.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Διατροφικές Προτιμήσεις (προαιρετικά)</h3>
            <div className="grid gap-2">
              {PREFERENCES.map(pref => (
                <div
                  key={pref.value}
                  className={`flex items-center space-x-3 p-3 border rounded-none cursor-pointer transition-colors ${
                    formData.preferences.includes(pref.value) ? 'border-[#00ffba] bg-[#00ffba]/5' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => togglePreference(pref.value)}
                >
                  <Checkbox checked={formData.preferences.includes(pref.value)} />
                  <span className="text-sm">{pref.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Allergies */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Αλλεργίες / Δυσανεξίες (προαιρετικά)</h3>
            <div className="grid gap-2">
              {ALLERGIES.map(allergy => (
                <div
                  key={allergy.value}
                  className={`flex items-center space-x-3 p-3 border rounded-none cursor-pointer transition-colors ${
                    formData.allergies.includes(allergy.value) ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleAllergy(allergy.value)}
                >
                  <Checkbox checked={formData.allergies.includes(allergy.value)} />
                  <span className="text-sm">{allergy.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <Label>Επιπλέον Σημειώσεις</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="π.χ. Δεν τρώω κρέας τις Τετάρτες..."
                className="rounded-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Health */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium">Πληροφορίες Υγείας (προαιρετικά)</h3>

            <div className="space-y-4">
              <div
                className={`flex items-center space-x-3 p-3 border rounded-none cursor-pointer transition-colors ${
                  formData.hasDiabetes ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, hasDiabetes: !prev.hasDiabetes, diabetesType: '' }))}
              >
                <Checkbox checked={formData.hasDiabetes} />
                <span className="text-sm">Έχω διαβήτη</span>
              </div>

              {formData.hasDiabetes && (
                <div className="ml-0 sm:ml-6 space-y-2">
                  <Label>Τύπος Διαβήτη</Label>
                  <RadioGroup
                    value={formData.diabetesType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, diabetesType: value }))}
                  >
                    <div className="flex items-center space-x-3 p-2 border rounded-none hover:bg-gray-50">
                      <RadioGroupItem value="type1" id="type1" />
                      <Label htmlFor="type1" className="cursor-pointer">Τύπου 1</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 border rounded-none hover:bg-gray-50">
                      <RadioGroupItem value="type2" id="type2" />
                      <Label htmlFor="type2" className="cursor-pointer">Τύπου 2</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 border rounded-none hover:bg-gray-50">
                      <RadioGroupItem value="gestational" id="gestational" />
                      <Label htmlFor="gestational" className="cursor-pointer">Κύησης</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Label>Φάρμακα που λαμβάνετε (αν υπάρχουν)</Label>
                <Textarea
                  value={formData.medications}
                  onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                  placeholder="π.χ. Μετφορμίνη 500mg, Ινσουλίνη..."
                  className="rounded-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Generate */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center py-6">
            <div className="inline-flex p-4 bg-[#00ffba]/10 rounded-full">
              <Brain className="w-12 h-12 text-[#00ffba]" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Έτοιμο για Δημιουργία!</h3>
            </div>


            <Card className="rounded-none text-left">
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Χρήστης:</span>
                  <span className="font-medium text-right">{formData.userName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Στόχος:</span>
                  <span className="font-medium text-right">{GOALS.find(g => g.value === formData.goal)?.label}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Εκτιμώμενες Θερμίδες:</span>
                  <span className="font-medium text-[#00ffba] text-right">{calculateCalories()} kcal/ημέρα</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generatePlan}
              disabled={generating || loading}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Δημιουργία Προγράμματος...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Δημιουργία με AI
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation - sticky footer */}
      {currentStep < 5 && (
        <div className="shrink-0 pt-3 border-t flex justify-between gap-3 mt-auto">
          <Button
            variant="outline"
            onClick={() => currentStep === 0 ? onCancel() : setCurrentStep(prev => prev - 1)}
            className="rounded-none flex-1 sm:flex-none"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{currentStep === 0 ? 'Ακύρωση' : 'Πίσω'}</span>
            <span className="sm:hidden">{currentStep === 0 ? 'Ακύρ.' : 'Πίσω'}</span>
          </Button>
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black flex-1 sm:flex-none"
          >
            Επόμενο
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
