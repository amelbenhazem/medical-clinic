import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialiser le client Gemini (GRATUIT)
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || ''
)

// Modèle gratuit : gemini-pro
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-pro' 
})

/**
 * Génère du texte avec Gemini (GRATUIT)
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error calling Gemini:', error)
    throw error
  }
}

/**
 * Génère du JSON structuré avec Gemini (GRATUIT)
 */
export async function generateJSON(prompt: string): Promise<any> {
  const enhancedPrompt = `${prompt}\n\nIMPORTANT: Retourne UNIQUEMENT du JSON valide, sans markdown, sans code blocks, sans explications supplémentaires.`
  
  try {
    const text = await generateText(enhancedPrompt)
    
    // Nettoyer la réponse (enlever markdown si présent)
    let cleaned = text.trim()
    
    // Enlever les code blocks markdown
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Enlever les explications avant/après le JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }
    
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Error parsing JSON from Gemini:', error)
    console.error('Raw response:', text)
    throw new Error('Invalid JSON response from AI')
  }
}
