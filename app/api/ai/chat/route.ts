import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json().catch(() => ({ query: "" }));
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a valid question" }, { status: 400 });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ answer: getLocalChatFallback(query) });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are MacroMind, a concise, friendly, and practical nutrition coach. Give clear, bulleted recipes or diet tips in 3-4 short paragraphs."
          },
          { role: "user", content: query }
        ]
      });
      return NextResponse.json({ answer: completion.choices[0]?.message.content ?? "No answer received." });
    } catch (error) {
      console.warn("OpenAI chat failed, using local fallback:", error);
      return NextResponse.json({ answer: getLocalChatFallback(query) });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getLocalChatFallback(query: string): string {
  const clean = query.toLowerCase();

  // 1. Greetings
  if (clean.includes("hi") || clean.includes("hello") || clean.includes("hey") || clean.includes("who are you") || clean.includes("help") || clean.includes("coach")) {
    return `**Hello! I am MacroMind, your personal AI Coach.** 🥦

I am here to help you hit your nutrition goals, suggest high-protein recipes, and give smart food-swap advice! 

Try asking me:
- *"Give me a high protein paneer dinner recipe"*
- *"Suggest a quick low-carb breakfast"*
- *"How can I get more protein as a vegetarian?"*
- *"Suggest a healthy snack option"*
- *"Give me some advice for fat loss"*`;
  }

  // 2. Chicken/Meat
  if (clean.includes("chicken") || clean.includes("meat") || clean.includes("non-veg") || clean.includes("fish") || clean.includes("salmon")) {
    return `**AI Coach Recipe (High-Protein Chicken Salad)**:
- **Ingredients**: 150g grilled chicken breast, 1 cup chopped cucumber, 1/2 cup cherry tomatoes, 1 tbsp olive oil, lemon juice, salt, and pepper.
- **Macros**: ~320 kcal | 42g Protein | 8g Carbs | 12g Fats.
- **Preparation**: Slice the chicken breast. Toss cucumbers and tomatoes in a bowl. Drizzle with olive oil, squeeze fresh lemon juice, add salt/pepper, and top with chicken. Quick, fresh, and lean!`;
  }

  // 3. Paneer / Veg
  if (clean.includes("paneer") || clean.includes("veg") || clean.includes("vegetarian")) {
    return `**AI Coach Recipe (Quick Paneer Bhurji - Vegetarian)**:
- **Ingredients**: 100g crumbled low-fat paneer, 1 small onion, 1 tomato, 1/2 tsp turmeric, green chilies, coriander, 1 tsp ghee.
- **Macros**: ~240 kcal | 18g Protein | 6g Carbs | 16g Fats.
- **Preparation**: Sauté onions and chilies in ghee. Add chopped tomatoes, turmeric, and salt. Stir in crumbled paneer, cook for 3 minutes. Garnish with fresh coriander!`;
  }

  // 4. Soya / Tofu / Vegan
  if (clean.includes("soya") || clean.includes("soy") || clean.includes("tofu") || clean.includes("vegan")) {
    return `**AI Coach Recipe (High-Protein Soya & Tofu Stir-Fry)**:
- **Ingredients**: 50g soya chunks (boiled), 100g firm tofu, 1 bell pepper, 1 onion, 1 tsp olive oil, soy sauce, ginger-garlic paste.
- **Macros**: ~290 kcal | 34g Protein | 18g Carbs | 8g Fats.
- **Preparation**: Boiled soya chunks squeezed dry. Sauté peppers, onions, and tofu cubes in olive oil with ginger-garlic paste. Toss in soya chunks, add a splash of soy sauce, and cook for 5 minutes. Clean and plant-powered!`;
  }

  // 5. Breakfast / Morning / Oats / Egg
  if (clean.includes("breakfast") || clean.includes("morning") || clean.includes("egg") || clean.includes("oats")) {
    return `**AI Coach Breakfast Suggestion (Fluffy Egg White & Oats Omelette)**:
- **Ingredients**: 4 egg whites, 30g rolled oats (ground), 1/2 chopped onion, spinach leaves, salt, pepper, 1 tsp olive oil.
- **Macros**: ~260 kcal | 22g Protein | 20g Carbs | 6g Fats.
- **Preparation**: Whisk egg whites with ground oats, spinach, onion, salt, and pepper. Heat oil in a pan, pour in the mixture, and cook for 3 minutes on each side. A perfect slow-digesting, high-protein breakfast!`;
  }

  // 6. Snack / Shake / Smoothie / Yogurt
  if (clean.includes("snack") || clean.includes("shake") || clean.includes("smoothie") || clean.includes("yogurt")) {
    return `**AI Coach Snack Suggestion (Berry Protein Yogurt Bowl)**:
- **Ingredients**: 200g low-fat Greek yogurt, 50g mixed berries (strawberries/blueberries), 10g chia seeds, 1/2 scoop whey protein (optional).
- **Macros**: ~210 kcal | 24g Protein | 15g Carbs | 3g Fats.
- **Preparation**: Mix the protein powder smoothly into the Greek yogurt. Top with fresh berries and sprinkle with chia seeds. An amazing creamy snack that curbs sweet cravings!`;
  }

  // 7. Carb / Low Carb / Sugar / Keto / Bread / Rice
  if (clean.includes("carb") || clean.includes("sugar") || clean.includes("keto") || clean.includes("bread") || clean.includes("rice")) {
    return `**AI Coach Low-Carb Swap Advice**:
- **Smart Swaps**:
  - Replace White Rice with *Cauliflower Rice* (~85% fewer carbs).
  - Replace Wheat Pasta with *Zucchini Noodles (Zoodles)* (~90% fewer carbs).
  - Replace Potato Chips with *Roasted Makhana (Lotus Seeds)* or *Cucumber Slices with Hummus*.
  - Replace Sugary Sodas with *Sparkling Water with Squeezed Lime*.
- **Pro Tip**: To manage carb spikes, always pair your carbs with a source of protein and healthy fiber. This slows down sugar absorption and keeps energy stable.`;
  }

  // 8. Protein / Muscle / Bulk / Gain
  if (clean.includes("protein") || clean.includes("muscle") || clean.includes("bulk") || clean.includes("gain")) {
    return `**AI Coach Advice (Optimizing Protein Intake)**:
- **Daily Target**: Aim for 1.6 to 2.2 grams of protein per kilogram of body weight to support muscle recovery and maintenance.
- **Top Sources**:
  - *Non-Vegetarian*: Chicken breast, eggs/egg whites, salmon, turkey.
  - *Vegetarian*: Low-fat paneer, Greek yogurt, Moong dal, chickpeas.
  - *Vegan*: Soya chunks/nuggets, tofu, tempeh, lentils.
- **Pro Tip**: Space your protein intake evenly across 3-4 meals throughout the day (approx. 25-35g per meal) to maximize muscle protein synthesis.`;
  }

  // 9. Weight / Lose / Fat / Deficit / Calorie
  if (clean.includes("fat") || clean.includes("lose") || clean.includes("weight") || clean.includes("calorie") || clean.includes("deficit")) {
    return `**AI Coach Advice (Healthy Weight Loss)**:
- **Calorie Deficit**: Aim for a moderate deficit of 300 to 500 calories below your Total Daily Energy Expenditure (TDEE).
- **Practical Strategies**:
  - Increase fiber intake (vegetables, oats, whole grains) to stay full longer.
  - Prioritize protein at every meal to protect muscle mass.
  - Drink 2.5 to 3 liters of water daily to support hydration and metabolic efficiency.
- **Avoid**: Liquid calories (sodas, juices, sugary coffees) and highly processed snack packs.`;
  }

  // 10. Water / Hydrate / Hydration
  if (clean.includes("water") || clean.includes("hydrate") || clean.includes("hydration")) {
    return `**AI Coach Hydration Guidelines**:
- **Daily Target**: Aim for 3 to 4 liters of clean water daily (approx. 12-16 cups).
- **Why it matters**: Hydration helps flush metabolic waste, supports nutrient absorption, maintains joint health, and plays a crucial role in fat metabolism.
- **Pro Tip**: Drink 500ml of water immediately upon waking to kickstart digestion, and keep a reusable bottle on your desk as a visual reminder.`;
  }

  // Default catch-all
  return `**AI Coach Response**:
I see you're asking about diet or lifestyle! Although the question didn't trigger one of our custom guides, here is a general tip:

- **Balanced Plate Method**: Fill 1/2 of your plate with non-starchy vegetables (fiber), 1/4 with lean protein (muscle recovery), and 1/4 with complex carbohydrates (sustained energy).
- Try searching for terms like: *chicken*, *paneer*, *vegan*, *breakfast*, *snack*, *protein*, *low carb*, *water*, or *weight loss* to see specific guides!`;
}
