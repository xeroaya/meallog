export const maxDuration = 30

const FOOD_LABELS = [
  'Food', 'Dish', 'Cuisine', 'Meal', 'Recipe', 'Ingredient',
  'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drink',
  'Beverage', 'Baking', 'Seafood', 'Meat', 'Vegetable', 'Fruit',
  'Noodle', 'Rice', 'Bread', 'Soup', 'Salad', 'Sushi', 'Ramen',
  'Pizza', 'Burger', 'Sandwich', 'Pasta', 'Steak', 'Curry',
  'Coffee', 'Tea', 'Juice', 'Beer', 'Wine', 'Cake', 'Cookie',
  'Ice cream', 'Chocolate', 'Cheese', 'Egg', 'Chicken', 'Pork',
  'Beef', 'Fish', 'Shrimp', 'Tofu', 'Tempura', 'Yakitori',
  'Bento', 'Donburi', 'Udon', 'Soba', 'Takoyaki', 'Okonomiyaki',
  'Japanese cuisine', 'Chinese cuisine', 'Italian cuisine', 'Fast food',
  'Street food', 'Comfort food', 'Health food', 'Junk food',
]

const REJECT_LABELS = [
  'Cartoon', 'Illustration', 'Drawing', 'Animation', 'Anime',
  'Manga', 'Comics', 'Clipart', 'Logo', 'Text', 'Poster',
  'Packaging', 'Product', 'Label', 'Brand', 'Graphic design',
  'Pattern', 'Wallpaper', 'Art', 'Painting', 'Sculpture',
]

export async function POST(req) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) {
      return Response.json({ error: '画像データがありません' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'APIキーが設定されていません' }, { status: 500 })
    }

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'SAFE_SEARCH_DETECTION' },
            ]
          }]
        })
      }
    )

    const visionData = await visionRes.json()
    const labels = visionData.responses?.[0]?.labelAnnotations || []

    // イラスト・アニメ判定
    const isIllustration = labels.some(l =>
      REJECT_LABELS.some(r => l.description.toLowerCase().includes(r.toLowerCase())) && l.score > 0.7
    )
    if (isIllustration) {
      return Response.json({
        food_percent: 0,
        reason: 'イラストまたはアニメ画像のため投稿できません'
      })
    }

    // 食べ物スコア計算
    let foodScore = 0
    let foodLabel = ''
    for (const label of labels) {
      const isFoodLabel = FOOD_LABELS.some(f =>
        label.description.toLowerCase().includes(f.toLowerCase())
      )
      if (isFoodLabel && label.score > foodScore) {
        foodScore = label.score
        foodLabel = label.description
      }
    }

    const foodPercent = Math.round(foodScore * 100)
    const reason = foodPercent >= 60
      ? `${foodLabel}の写真と判定しました`
      : labels.length > 0
        ? `${labels[0].description}の写真です（食べ物ではありません）`
        : '食べ物が検出できませんでした'

    return Response.json({ food_percent: foodPercent, reason })

  } catch (e) {
    console.error(e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
