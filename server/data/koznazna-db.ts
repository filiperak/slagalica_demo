export interface KoznaznaQuestion {
    question: string;
    answer: string;
    wrong: [string, string, string];
}

export const koznaznaDB: KoznaznaQuestion[] = [
    {
        question: "Koji grad je glavni grad Australije?",
        answer: "Kanbera",
        wrong: ["Sidnej", "Melburn", "Brisben"],
    },
    {
        question: "Koja je najduža reka na svetu?",
        answer: "Nil",
        wrong: ["Amazon", "Jangce", "Misisipi"],
    },
    {
        question: "Koja zemlja ima najviše kopnenih granica s drugim državama?",
        answer: "Kina",
        wrong: ["Rusija", "Brazil", "Nemačka"],
    },
    {
        question: "Na kojoj nadmorskoj visini se nalazi planina Everest?",
        answer: "8.849 m",
        wrong: ["8.611 m", "8.167 m", "8.091 m"],
    },
    {
        question: "Koji okean je najdublji?",
        answer: "Tihi okean",
        wrong: ["Atlantski okean", "Indijski okean", "Arktički okean"],
    },
    {
        question: "U kojoj državi se nalazi grad Marakesh?",
        answer: "Maroko",
        wrong: ["Alžir", "Tunis", "Libija"],
    },
    {
        question: "Koja je najnaseljenija zemlja Afrike?",
        answer: "Nigerija",
        wrong: ["Etiopija", "Egipat", "Demokratska Republika Kongo"],
    },
    {
        question: "Koliko država ima Evropska unija (2024)?",
        answer: "27",
        wrong: ["25", "28", "30"],
    },

    // History
    {
        question: "Koje godine je pao Berlinski zid?",
        answer: "1989.",
        wrong: ["1991.", "1987.", "1985."],
    },
    {
        question: "Ko je bio prvi predsednik SAD?",
        answer: "Džordž Vašington",
        wrong: ["Bendžamin Franklin", "Džon Adams", "Tomas Džeferson"],
    },
    {
        question: "U kom veku je živeo Džingis-kan?",
        answer: "XII–XIII vek",
        wrong: ["X–XI vek", "XIV–XV vek", "VIII–IX vek"],
    },
    {
        question: "Koje godine je počeo Prvi svetski rat?",
        answer: "1914.",
        wrong: ["1912.", "1916.", "1918."],
    },
    {
        question: "Ko je izgradio Tadž Mahal?",
        answer: "Šah Džahan",
        wrong: ["Akbar Veliki", "Aurangzeb", "Babur"],
    },
    {
        question: "Koji car je uveo jul i avgust u rimski kalendar?",
        answer: "August",
        wrong: ["Julije Cezar", "Neron", "Trajan"],
    },
    {
        question: "Koji narod je izgradio Maču Piču?",
        answer: "Inke",
        wrong: ["Maje", "Acteci", "Čimuji"],
    },

    // Science & Nature
    {
        question: "Koliko elektrona ima atom kiseonika?",
        answer: "8",
        wrong: ["6", "10", "16"],
    },
    {
        question: "Koji element ima hemijski simbol Au?",
        answer: "Zlato",
        wrong: ["Srebro", "Aluminijum", "Bakar"],
    },
    {
        question: "Koliko DNK parova baza ima u jednoj ćeliji čoveka?",
        answer: "Oko 3 milijarde",
        wrong: ["Oko 300 miliona", "Oko 30 milijardi", "Oko 3 triliona"],
    },
    {
        question: "Koji planet ima najveći broj meseci u Sunčevom sistemu?",
        answer: "Saturn",
        wrong: ["Jupiter", "Uran", "Neptun"],
    },
    {
        question: "Koja je osnovna jedinica nasledne informacije?",
        answer: "Gen",
        wrong: ["Hromozom", "Nukleotid", "Protein"],
    },
    {
        question: "Na kojoj temperaturi ključa voda na visini od 3.000 m?",
        answer: "Oko 90°C",
        wrong: ["Oko 95°C", "Oko 85°C", "Tačno 100°C"],
    },
    {
        question: "Koji organ u ljudskom telu proizvodi insulin?",
        answer: "Pankreas",
        wrong: ["Jetra", "Bubreg", "Slezina"],
    },
    {
        question: "Koliko kostiju ima odrasla osoba?",
        answer: "206",
        wrong: ["210", "198", "213"],
    },
    {
        question: "Koji gas čini oko 78% Zemljine atmosfere?",
        answer: "Azot",
        wrong: ["Kiseonik", "Argon", "Ugljen-dioksid"],
    },
    {
        question: "Koja sila drži elektrone u orbiti oko jezgra atoma?",
        answer: "Elektromagnetna sila",
        wrong: ["Gravitaciona sila", "Jaka nuklearna sila", "Slaba nuklearna sila"],
    },

    // Mathematics
    {
        question: "Koliko prostih brojeva postoji između 1 i 50?",
        answer: "15",
        wrong: ["12", "18", "14"],
    },
    {
        question: "Koji je zbir unutrašnjih uglova petougla?",
        answer: "540°",
        wrong: ["360°", "450°", "720°"],
    },
    {
        question: "Šta je Ojlerova konstanta e (zaokružena na 4 decimale)?",
        answer: "2,7183",
        wrong: ["3,1416", "1,6180", "2,3026"],
    },
    {
        question: "Koliki je ostatak pri deljenju broja 2^10 sa 7?",
        answer: "2",
        wrong: ["4", "1", "6"],
    },
    {
        question: "Koja je površina kruga poluprecnika 5 cm? (π ≈ 3,14)",
        answer: "78,5 cm²",
        wrong: ["31,4 cm²", "62,8 cm²", "157 cm²"],
    },

    // Literature & Art
    {
        question: "Ko je napisao roman 'Sto godina samoće'?",
        answer: "Gabrijel Garsija Markes",
        wrong: ["Mario Vargaš Ljosa", "Horhe Luis Borhes", "Pablo Neruda"],
    },
    {
        question: "Koji pesnik je napisao 'Božanstvenu komediju'?",
        answer: "Dante Aligijeri",
        wrong: ["Frančesko Petrarka", "Đovani Bokačo", "Ludoviko Ariosto"],
    },
    {
        question: "U kom gradu je rođen Nikola Tesla?",
        answer: "Smiljan",
        wrong: ["Beograd", "Zagreb", "Novi Sad"],
    },
    {
        question: "Ko je naslikao 'Poslednju večeru'?",
        answer: "Leonardo da Vinči",
        wrong: ["Mikelanđelo", "Rafael", "Đoto di Bondone"],
    },
    {
        question: "Koji kompozitor je bio potpuno gluv kada je komponovao Devetu simfoniju?",
        answer: "Betoven",
        wrong: ["Mocart", "Brams", "Šubert"],
    },

    // Sports
    {
        question: "Koja zemlja je pobednik FIFA Svetskog prvenstva 2022?",
        answer: "Argentina",
        wrong: ["Francuska", "Brazil", "Nemačka"],
    },
    {
        question: "Koliko igrača ima tim u košarkaškoj utakmici (na terenu)?",
        answer: "5",
        wrong: ["6", "4", "7"],
    },
    {
        question: "Ko drži rekord u broju Grend Slem titula u tenisu (muški, 2024)?",
        answer: "Novak Đoković",
        wrong: ["Rafael Nadal", "Rodžer Federer", "Karlos Alkaraz"],
    },
    {
        question: "Koji grad je domaćin Olimpijskih igara 2024?",
        answer: "Pariz",
        wrong: ["Los Anđeles", "Brizbejn", "Tokio"],
    },

    // Technology & Physics
    {
        question: "Šta znači akronim HTTP?",
        answer: "HyperText Transfer Protocol",
        wrong: [
            "High Transfer Text Protocol",
            "HyperText Transmission Process",
            "Hyperlink Transfer Technology Platform",
        ],
    },
    {
        question: "Ko je izmislio World Wide Web?",
        answer: "Tim Berners-Li",
        wrong: ["Vint Serf", "Bill Gates", "Linus Torvalds"],
    },
    {
        question: "Koja je brzina svetlosti u vakuumu (zaokružena)?",
        answer: "300.000 km/s",
        wrong: ["150.000 km/s", "450.000 km/s", "299 km/s"],
    },
    {
        question: "Koji fizičar je formulisao opštu teoriju relativnosti?",
        answer: "Albert Ajnštajn",
        wrong: ["Maks Plank", "Nils Bor", "Verner Hajzenberg"],
    },
    {
        question: "Koliki je broj Avogadro (red veličine)?",
        answer: "6,022 × 10²³",
        wrong: ["6,022 × 10¹⁶", "6,022 × 10³⁰", "6,022 × 10¹²"],
    },

    // Serbian / Balkan culture
    {
        question: "Ko je napisao ep 'Gorski vijenac'?",
        answer: "Petar II Petrović Njegoš",
        wrong: ["Vuk Stefanović Karadžić", "Jovan Jovanović Zmaj", "Dositej Obradović"],
    },
    {
        question: "Koje godine je Srbija postala kandidat za članstvo u EU?",
        answer: "2012.",
        wrong: ["2009.", "2014.", "2016."],
    },
    {
        question: "Koji srpski naučnik je patentirao sistem izmjenične struje?",
        answer: "Nikola Tesla",
        wrong: ["Mihajlo Pupin", "Mileva Marić", "Josif Pančić"],
    },
    {
        question: "Na kojoj reci leži Beograd?",
        answer: "Savi i Dunavu",
        wrong: ["Moravi i Dunavu", "Tisi i Savi", "Drini i Savi"],
    },
    {
        question: "Koja planina je najviša u Srbiji?",
        answer: "Đeravica",
        wrong: ["Midzor", "Kopaonik", "Zlatibor"],
    },
];
