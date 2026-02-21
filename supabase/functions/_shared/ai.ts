export async function analyzeSiteWithAi(cleanText: string) {
    // 2. Call DeepSeek API
    // @ts-ignore
    const deepseekKey = Deno.env.get("DEEPSEEK_API");
    if (!deepseekKey) throw new Error("Missing DEEPSEEK_API environment variable");

    console.log("Analyzing with DeepSeek...");
    const aiRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "You are an intelligent web scraper assistant. Return only valid JSON."
                },
                {
                    role: "user",
                    content: `Analyze the following website content. Provide a JSON object with:
                        - "language": use the full language name (e.g. "English", "French" etc)
                        - "name": The name of the website or brand.
                        - "description": A short description of the website (max 80 words) - in the detected language.
                        - "direction": "ltr" or "rtl" based on the language.
                        - "disclaimer_text": Translate this sentence into the detected language: "This is an AI driven tool, results might not always be accurate"
                        - "placeholders": Translate these 4 phrases into the detected language of the site: 
                          1. "Summarize this article"
                          2. "I can help you with this article!"
                          3. "Ask me anything on this content"
                          4. "What would you like to know?"
                          Return them as an array of strings.

                        Content:
                        ${cleanText}`
                }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("DeepSeek API Error:", errText);
        throw new Error("Failed to get analysis from DeepSeek");
    }

    const aiData = await aiRes.json();
    const result = JSON.parse(aiData.choices[0].message.content);
    console.log("Analysis result:", result);

    return result;
}