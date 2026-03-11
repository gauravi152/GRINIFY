import re

def get_chatbot_response(query: str) -> str:
    """
    Returns a response based on keywords found in the user's query.
    Uses regex for word boundaries to avoid false positives like 'can' matching 'cans'.
    """
    query = query.lower().strip()
    
    # Knowledge Base
    data = {
        "batteries": {
            "keywords": [r"batter(y|ies)", r"alkaline", r"lithium", r"rechargeable", r"aa(a)?", r"9v", r"button cell", r"car battery"],
            "response": "🔋 Batteries are hazardous! Never put them in your regular bins. Most supermarkets, libraries, and hardware stores (like Home Depot) have free battery collection bins. Car batteries must be taken to specialized facilities or retailers like AutoZone."
        },
        "e_waste": {
            "keywords": [r"e-waste", r"electronic", r"phone", r"laptop", r"computer", r"cable", r"charger", r"tv", r"monitor", r"gadget", r"keyboard", r"mouse", r"printer", r"tablet", r"monitor"],
            "response": "💻 E-waste contains valuable metals but also toxic chemicals. Do NOT throw them in the trash! Take them to a dedicated e-waste recycling center or retailers like Best Buy or Staples."
        },
        "hazardous": {
            "keywords": [r"hazardous", r"paint", r"chemical", r"oil", r"pesticide", r"bleach", r"toxic", r"poison", r"solvent", r"cleaning", r"aerosol", r"gas canister"],
            "response": "⚠️ Hazardous waste (paint, oil, chemicals) needs special handling. Check your local council website for 'Household Hazardous Waste' drop-off days. Never pour these down the drain!"
        },
        "lightbulbs": {
            "keywords": [r"bulb", r"light( )?bulb", r"led", r"fluorescent", r"tube", r"cfl", r"halogen"],
            "response": "💡 Different bulbs need different disposal. LED and CFL bulbs contain mercury and should be recycled at hardware stores (Home Depot, IKEA). Incandescent bulbs go in general waste but should be wrapped for safety."
        },
        "textiles": {
            "keywords": [r"clothes", r"clothing", r"textile", r"fabric", r"shirt", r"jean", r"curtain", r"towel", r"shoe", r"leather", r"cotton", r"wool"],
            "response": "👕 Textiles shouldn't go in the yellow bin. Donate good quality clothes to charity shops. For ripped or stained fabric, look for textile recycling bins or programs like H&M's garment collection."
        },
        "mixed": {
            "keywords": [r"tetrapak", r"tetra( )?pak", r"carton", r"milk box", r"juice box", r"pringle", r"composite", r"pouch"],
            "response": "🥤 Tetra Paks and cartons are tricky because they're made of paper, plastic, and foil. Many cities now have the specialized equipment to recycle them—check if your local recycling accepts 'Cartons' specifically."
        },
        "organic": {
            "keywords": [r"organic", r"food", r"compost", r"fruit", r"leaf", r"vegetable", r"peeling", r"scrap", r"bread", r"coffee ground", r"egg shell", "meat", "dairy"],
            "response": "🍎 All food scraps, coffee grounds, and garden waste are compostable! They're 'green' gold for your garden. If you don't have a backyard, look for a community garden or a council food-scrap collection service."
        },
        "plastic": {
            "keywords": [r"plastic", r"bottle", r"container", r"ptfe", r"polystyrene", r"polyethylene", r"pvc", r"tupperware", r"wrap", r"nylon", r"acrylic"],
            "response": "♻️ Most hard plastics marks 1, 2, or 5 are widely recyclable (like water bottles and milk jugs). Soft plastics like bags and bread wraps usually need a separate collection point at your local grocery store."
        },
        "paper": {
            "keywords": [r"paper", r"cardboard", "box", r"newspaper", r"magazine", r"envelope", r"mail", r"paperbag", r"shredded"],
            "response": "📄 Paper and cardboard are highly recyclable if they are clean and dry. Remove plastic tape and staples if possible. Avoid recycling greasy pizza boxes—compost them instead!"
        },
        "metal": {
            "keywords": [r"metal", r"can(s)?\b(?!(\s+i\s+))", r"aluminum", r"tin", r"steel", r"foil", r"soda can", r"brass", r"copper"],
            "response": "🥫 Aluminum and steel cans are infinitely recyclable! Rinse them first. You can also recycle clean aluminum foil—try to scrunch it into a ball about the size of a fist before placing it in the bin."
        },
        "glass": {
            "keywords": [r"glass", r"jar", r"wine bottle", r"beer bottle", r"broken glass", r"pickle jar"],
            "response": "🍶 Glass bottles and jars of all colors are recyclable. Metal lids should be removed and recycled separately. Note: Drinking glasses and Pyrex are different types of glass and should NOT go in your recycling bin."
        }
    }

    general_responses = {
        "hello": "👋 Hello! I'm Grinify's Eco-Assistant. How can I help you on your sustainability journey today?",
        "hi": "👋 Hi there! Want to know where something goes, or how to earn eco-points?",
        "help": "🆘 I can help you figure out how to recycle almost anything! Try asking 'Where do batteries go?' or 'Can I recycle pizza boxes?'. You can also ask about 'Points' or 'Scanning'.",
        "scan": "📸 Go to the 'Scan Waste' page, click 'Open Camera', and snap a photo. I'll identify the material and tell you exactly what to do with it!",
        "points": "🌟 You earn Eco Points every time you scan an item and confirm its disposal. These points track your impact and help you rank up on the Leaderboard!",
        "tip": "💡 Sustainability tip: Try the '5-second rule' for recycling—if it takes more than 5 seconds to rinse, it might be better off in the trash to avoid contaminating clean recyclables.",
        "thank": "You're very welcome! Keep being an eco-warrior! 🌿",
        "who are you": "🤖 I'm the Grinify AI assistant. My mission is to make recycling easy, accurate, and fun for everyone!",
        "bye": "👋 Goodbye! See you next time, and keep up the great work for our planet! 🌍"
    }

    # Better matching logic using word boundaries
    # First check materials/categories
    for category, info in data.items():
        for kw in info["keywords"]:
            if re.search(r'\b' + kw + r'\b', query):
                return info["response"]

    # Then check general intents
    for key, response in general_responses.items():
        if re.search(r'\b' + key + r'\b', query):
            return response
            
    return "🌿 I'm still learning about that specific item, but I can help with Plastic, Paper, Glass, Metals, E-waste, Batteries, Clothing, or Composting! \n\nWhat else is on your mind? You can also try scanning the item for an instant analysis!"
