sed -i 's/onClick={generateMeals}/onClick={() => generateMeals(false)}/g' src/components/MealDisplay.tsx
sed -i 's/onClick={handleGenerateFitness}/onClick={() => handleGenerateFitness(false)}/g' src/components/Fitness.tsx
