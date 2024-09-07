/* eslint-disable @typescript-eslint/no-explicit-any */
export const tagBox = {
  menu: (provided: any) => ({
    ...provided,
    boxShadow: '0px 0px 2px 0px grey',
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
  }),
  container: (provided: any) => ({
    ...provided,
  }),
  control: (provided: any) => ({
    ...provided,
    backgroundColor: 'rgba(46, 46, 46, 0.815)',
    boxShadow: '0px 0px 2px 0px grey',
    borderColor: '#6B7280',
    scrollbehavior: 'smooth',
  }),
  option: (provided: any) => ({
    ...provided,
    backgroundColor: 'none',
    color: 'black'
  }),
  singleValue: (provided: any) => ({
    ...provided,
  }),
  placeholder: (provided: any) => ({
    ...provided,
  }),
  input: (provided: any) => ({
    ...provided,
    color: 'white',
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }), // use higher zIndex if necessary
};

export const characterTags = [
  "Protagonist",
  "Antagonist",
  "Yandere",
  "Tsundere",
  "Kuudere",
  "Dandere",
  "Deredere",
  "Himedere",
  "Kamidere",
  "Mayadere",
  "Anime",
  "Fantasy",
  "Koios Academy",
  "Realistic",
  "Chatter",
  "Romance",
  "Adventure",
  "Horror",
  "Mystery",
  "Sci-Fi",
  "Historical",
  "Thriller",
  "Action",
  "Comedy",
  "Drama",
  "Poetry",
  "Other",
];

export const logicEngines = [
  {
    label: "Mytholite 7B",
    value: "mytholite",
    tier: "free",
  },
  {
    label: "MythoMax 13B",
    value: "mythomax",
    tier: "fire"
  },
  {
    label: "Mythalion 13B",
    value: "mythalion",
    tier: "fire"
  },
  // {
  //     label: "Weaver Alpha",
  //     value: "weaver-alpha",
  // },
  // {
  //     label: "Synthia 70B",
  //     value: "synthia-70b",
  //     tier: "ice"
  // },
  // {
  //     label: "Goliath 120B",
  //     value: "goliath-120b",
  //     tier: "crystal"
  // },
];

export const themeOptions = ["night", "dim", "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "coffee", "winter", "nord", "sunset"]

export const emotions = [
  {
    value: 'admiration',
    label: 'Admiration'
  },
  {
    value: 'amusement',
    label: 'Amusement'
  },
  {
    value: 'anger',
    label: 'Anger'
  },
  {
    value: 'annoyance',
    label: 'Annoyance'
  },
  {
    value: 'approval',
    label: 'Approval'
  },
  {
    value: 'caring',
    label: 'Caring'
  },
  {
    value: 'confusion',
    label: 'Confusion'
  },
  {
    value: 'curiosity',
    label: 'Curiosity'
  },
  {
    value: 'desire',
    label: 'Desire'
  },
  {
    value: 'disappointment',
    label: 'Disappointment'
  },
  {
    value: 'disapproval',
    label: 'Disapproval'
  },
  {
    value: 'disgust',
    label: 'Disgust'
  },
  {
    value: 'embarrassment',
    label: 'Embarrassment'
  },
  {
    value: 'fear',
    label: 'Fear'
  },
  {
    value: 'gratitude',
    label: 'Gratitude'
  },
  {
    value: 'grief',
    label: 'Grief'
  },
  {
    value: 'joy',
    label: 'Joy'
  },
  {
    value: 'love',
    label: 'Love'
  },
  {
    value: 'nervousness',
    label: 'Nervousness'
  },
  {
    value: 'neutral',
    label: 'Neutral'
  },
  {
    value: 'optimism',
    label: 'Optimism'
  },
  {
    value: 'pride',
    label: 'Pride'
  },
  {
    value: 'realization',
    label: 'Realization'
  },
  {
    value: 'relief',
    label: 'Relief'
  },
  {
    value: 'remorse',
    label: 'Remorse'
  },
  {
    value: 'sadness',
    label: 'Sadness'
  },
  {
    value: 'surprise',
    label: 'Surprise'
  },
  {
    value: 'excitement',
    label: 'Excitement'
  }
]

export type Emotion = 'surprise' | 'sadness' | 'remorse' | 'relief' | 'realization' | 'pride' | 'optimism' | 'neutral' | 'nervousness' | 'love' | 'joy' | 'grief' | 'gratitude' | 'fear' | 'embarrassment' | 'disgust' | 'disapproval' | 'disappointment' | 'desire' | 'curiosity' | 'confusion' | 'caring' | 'approval' | 'annoyance' | 'anger' | 'amusement' | 'admiration' | 'excitement';

export const spriteSetTypes = [
  {
    value: 'everyday',
    label: 'Everyday'
  },
  {
    value: 'formal',
    label: 'Formal'
  },
  {
    value: 'sleepwear',
    label: 'Sleepwear'
  },
  {
    value: 'swimwear',
    label: 'Swimwear'
  },
  {
    value: 'underwear',
    label: 'Underwear'
  },
  {
    value: 'naked',
    label: 'Naked'
  },
  {
    value: 'battle',
    label: 'Battle'
  },
  {
    value: 'winter',
    label: 'Winter',
  },
  {
    value: 'halloween',
    label: 'Halloween'
  },
  {
    value: 'christmas',
    label: 'Christmas'
  }
]

export const narrativeRoles = [
  {
    value: 'protagonist',
    label: 'Protagonist'
  },
  {
    value: 'antagonist',
    label: 'Antagonist'
  },
  {
    value: 'supporting',
    label: 'Supporting'
  },
  {
    value: 'neutral',
    label: 'Neutral'
  },
  {
    value: 'other',
    label: 'Other'
  },
  {
    value: 'love interest',
    label: 'Love Interest'
  },
  {
    value: 'mentor',
    label: 'Mentor'
  },
  {
    value: 'sidekick',
    label: 'Sidekick'
  },
  {
    value: 'villain',
    label: 'Villain'
  },
  {
    value: 'friend',
    label: 'Friend'
  },
];