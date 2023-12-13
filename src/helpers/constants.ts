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