const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load variables from .env.local
const envLocalPath = path.resolve(__dirname, "../.env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/);
  
  if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim().replace(/['"]/g, "");
  if (keyMatch && keyMatch[1]) supabaseServiceKey = keyMatch[1].trim().replace(/['"]/g, "");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const questions = [
  // 🎤 SPEAKING (5 types)
  {
    module: "speaking",
    task_type: "read-aloud",
    title: "Read Aloud — Climate Change impact",
    difficulty: "medium",
    content: {
      passage: "Climate change is one of the most pressing challenges of our time, affecting weather patterns, agricultural productivity, and global sea levels. Researchers worldwide are collaborating to develop sustainable technologies that can mitigate carbon emissions and secure a cleaner energy future."
    }
  },
  {
    module: "speaking",
    task_type: "read-aloud",
    title: "Read Aloud — Ancient Philosophy",
    difficulty: "hard",
    content: {
      passage: "Philosophy in the classical era was not merely an academic discipline but a practical guide to living. Thinkers like Socrates, Plato, and Aristotle engaged in vigorous public debates in the Agora, challenging assumptions and investigating the nature of virtue, justice, and the cosmos."
    }
  },
  {
    module: "speaking",
    task_type: "read-aloud",
    title: "Read Aloud — Artificial Intelligence",
    difficulty: "easy",
    content: {
      passage: "Artificial intelligence has transitioned from science fiction to an everyday utility. Today, machine learning algorithms power navigation services, translate languages in real time, and assist doctors in diagnosing complex medical conditions."
    }
  },

  {
    module: "speaking",
    task_type: "repeat-sentence",
    title: "Repeat Sentence — Library Resources",
    difficulty: "easy",
    content: {
      sentence: "All students have access to the digital library resources twenty-four hours a day."
    }
  },
  {
    module: "speaking",
    task_type: "repeat-sentence",
    title: "Repeat Sentence — Lab Safety",
    difficulty: "medium",
    content: {
      sentence: "Please ensure that you wear protective eyewear before entering the chemistry laboratory."
    }
  },
  {
    module: "speaking",
    task_type: "repeat-sentence",
    title: "Repeat Sentence — Assignment Deadline",
    difficulty: "hard",
    content: {
      sentence: "The final draft of the research paper must be submitted before Friday afternoon."
    }
  },

  {
    module: "speaking",
    task_type: "describe-image",
    title: "Describe Image — Demographic Shifts",
    difficulty: "medium",
    content: {
      image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
      description: "A bar chart illustrating the shifting demographics in urban versus rural areas over the last three decades, demonstrating a steady 15% increase in urban migration."
    }
  },
  {
    module: "speaking",
    task_type: "describe-image",
    title: "Describe Image — Hydrological Cycle",
    difficulty: "easy",
    content: {
      image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60",
      description: "A diagram mapping the Earth's water cycle, highlighting the main stages: evaporation, condensation, precipitation, and surface runoff back into oceans."
    }
  },
  {
    module: "speaking",
    task_type: "describe-image",
    title: "Describe Image — Corporate Structure",
    difficulty: "hard",
    content: {
      image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
      description: "An organizational flow-chart representing the structural hierarchy of a multinational corporation, dividing operations into regional hubs and corporate functional departments."
    }
  },

  {
    module: "speaking",
    task_type: "responding-to-situation",
    title: "Responding to Situation — Missed Exam",
    difficulty: "medium",
    content: {
      scenario: "You missed a final exam because your train broke down. You are now speaking with your professor in their office to request a makeup test.",
      question: "Explain the situation to the professor and request an alternative assessment opportunity."
    }
  },
  {
    module: "speaking",
    task_type: "responding-to-situation",
    title: "Responding to Situation — Late Rent",
    difficulty: "easy",
    content: {
      scenario: "Your paycheck was delayed, and you cannot pay your rent on the 1st of the month. You are calling your landlord.",
      question: "Apologize for the delay, explain the reason, and let them know the exact date you will pay."
    }
  },
  {
    module: "speaking",
    task_type: "responding-to-situation",
    title: "Responding to Situation — Group Project",
    difficulty: "hard",
    content: {
      scenario: "One of your group project partners has not contributed to the final slides due tomorrow morning. You are discussing this with them.",
      question: "Confront your partner diplomatically, ask if they need support, and highlight the deadline urgency."
    }
  },

  {
    module: "speaking",
    task_type: "answer-short-question",
    title: "Answer Short Question — Solar Energy",
    difficulty: "easy",
    content: {
      question: "What is the primary source of solar energy?",
      answer: "Sun"
    }
  },
  {
    module: "speaking",
    task_type: "answer-short-question",
    title: "Answer Short Question — Decades",
    difficulty: "medium",
    content: {
      question: "How many years are in a decade?",
      answer: "Ten"
    }
  },
  {
    module: "speaking",
    task_type: "answer-short-question",
    title: "Answer Short Question — Water State",
    difficulty: "easy",
    content: {
      question: "What state does water turn into when it is frozen?",
      answer: "Ice"
    }
  },

  // ✍️ WRITING (2 types)
  {
    module: "writing",
    task_type: "summarize-written-text",
    title: "Summarize Written Text — Biodiversity loss",
    difficulty: "medium",
    content: {
      passage: "Biodiversity loss is accelerating globally, primarily driven by human activities such as deforestation, urban expansion, and pollution. Forests shelter more than half of the world's terrestrial species, yet millions of hectares are cleared annually for agriculture. This destruction not only threatens wildlife but also compromises ecosystem services like carbon storage and clean water regulation. Mitigating this crisis requires coordinated international regulations, conservation zoning, and shifting towards sustainable land-use models.",
      model_answer: "Accelerating global biodiversity loss, driven by human actions like deforestation and pollution, threatens wildlife and essential ecosystems, necessitating immediate international cooperation and sustainable land conservation practices."
    }
  },
  {
    module: "writing",
    task_type: "summarize-written-text",
    title: "Summarize Written Text — Work from Home",
    difficulty: "easy",
    content: {
      passage: "The shift toward remote work has transformed the modern corporate landscape. Proponents argue it enhances employee work-life balance and reduces overhead costs for businesses. However, critics point out potential downsides including professional isolation, difficulty maintaining team cohesion, and blurred boundaries between professional and personal life. Ultimately, many organizations are adopting hybrid arrangements that attempt to combine the benefits of both in-office collaboration and home-based flexibility.",
      model_answer: "While remote work improves balance and reduces expenses, it can cause isolation, prompting many organizations to implement hybrid setups that blend collaboration with home flexibility."
    }
  },
  {
    module: "writing",
    task_type: "write-an-email",
    title: "Write an Email — Requesting Extension",
    difficulty: "medium",
    content: {
      scenario: "You need an extension on your research assignment due to sudden illness.",
      prompt: "Write an email to your course instructor, Dr. Sarah Jenkins, requesting a 3-day extension. Explain the situation and propose a new submission date.",
      model_answer: "Subject: Request for Assignment Extension - [Your Name]\n\nDear Dr. Jenkins,\n\nI hope this email finds you well. I am writing to request a short extension of three days on the upcoming research assignment, originally due this Friday. Unfortunately, I have contracted a severe illness and have been advised by my doctor to rest.\n\nI am confident that a three-day extension until next Monday will allow me to complete the work to a high standard. I have attached my medical certificate for your reference.\n\nThank you for your time and understanding.\n\nSincerely,\n[Your Name]\nStudent ID: 12345"
    }
  },
  {
    module: "writing",
    task_type: "write-an-email",
    title: "Write an Email — IT Support ticket",
    difficulty: "easy",
    content: {
      scenario: "Your work laptop keeps crashing whenever you launch the company database software.",
      prompt: "Write an email to IT Support. Describe the error, mention when it occurs, and request a troubleshooting appointment.",
      model_answer: "Subject: Database Crash - Urgent IT Support Request\n\nDear IT Support Team,\n\nI am writing to report a recurring issue with my company laptop. Every time I attempt to launch the database software, the entire system crashes and displays a blue screen error.\n\nThis is severely impacting my ability to perform my daily reports. I would appreciate it if we could schedule a troubleshooting session as soon as possible to resolve this.\n\nBest regards,\n[Your Name]"
    }
  },

  // 📖 READING (5 types — implement scoring)
  {
    module: "reading",
    task_type: "rw-fill-in-the-blanks",
    title: "R&W Blanks — Photosynthesis",
    difficulty: "medium",
    content: {
      passage_with_blanks: "Photosynthesis is the chemical process by which green plants [blank_0] light energy into chemical energy. During this process, plants absorb carbon dioxide and water to produce oxygen and glucose. Chlorophyll, the green pigment in leaves, plays a [blank_1] role in absorbing the sunlight necessary to [blank_2] this conversion.",
      word_bank: ["convert", "critical", "trigger", "destroy", "minor", "prevent", "transfer", "generate"],
      answers: {
        blank_0: "convert",
        blank_1: "critical",
        blank_2: "trigger"
      }
    }
  },
  {
    module: "reading",
    task_type: "rw-fill-in-the-blanks",
    title: "R&W Blanks — Globalization Economics",
    difficulty: "hard",
    content: {
      passage_with_blanks: "The modern global economy is characterized by high levels of interdependence. As nations [blank_0] barriers to trade, goods and services flow more freely across borders. However, this openness also makes local markets [blank_1] to international economic shocks, creating a need for careful [blank_2] of domestic policies.",
      word_bank: ["dismantle", "vulnerable", "regulation", "strengthen", "immune", "inspection", "build", "indifferent"],
      answers: {
        blank_0: "dismantle",
        blank_1: "vulnerable",
        blank_2: "regulation"
      }
    }
  },
  {
    module: "reading",
    task_type: "rw-fill-in-the-blanks",
    title: "R&W Blanks — Healthy Diet",
    difficulty: "easy",
    content: {
      passage_with_blanks: "Eating a balanced diet is [blank_0] for maintaining good health. You should consume a [blank_1] of fruits, vegetables, and whole grains every day, which helps [blank_2] the risk of chronic diseases.",
      word_bank: ["essential", "variety", "reduce", "optional", "monopoly", "increase", "useless", "mixture"],
      answers: {
        blank_0: "essential",
        blank_1: "variety",
        blank_2: "reduce"
      }
    }
  },

  {
    module: "reading",
    task_type: "multiple-choice-multiple",
    title: "MCQ Multiple — Renaissance Humanism",
    difficulty: "hard",
    content: {
      passage: "Renaissance humanism was an intellectual movement typified by a revived interest in the classical art, literature, and learning of ancient Greece and Rome. Moving away from medieval scholasticism, which focused heavily on religious theology, humanists advocated for a curriculum based on the liberal arts—grammar, rhetoric, history, poetry, and moral philosophy. They believed that these studies promoted individual potential and civic responsibility, preparing citizens to take an active part in public life.",
      question: "According to the passage, which of the following statements about Renaissance humanism are correct?",
      options: [
        "A) It rejected the study of classical Greek and Roman texts.",
        "B) It emphasized liberal arts education over medieval religious scholasticism.",
        "C) It aimed to prepare citizens for participation in civic and public life.",
        "D) It discouraged the study of rhetoric and moral philosophy.",
        "E) It originated as a system to train scholastic theologians."
      ],
      correct_answers: ["B", "C"]
    }
  },
  {
    module: "reading",
    task_type: "multiple-choice-multiple",
    title: "MCQ Multiple — Solar Panels",
    difficulty: "medium",
    content: {
      passage: "Photovoltaic cells, commonly known as solar panels, convert sunlight directly into electricity. Their efficiency depends on several variables, including the angle of solar incidence, ambient temperature, and structural shading. While modern silicon panels average 18% to 22% efficiency, newer multi-junction cells developed for aerospace applications can exceed 40%, although they remain prohibitively expensive for standard residential installations.",
      question: "Which factors are described as affecting the efficiency of solar panels?",
      options: [
        "A) The angle at which sunlight hits the panel.",
        "B) The ambient temperature surrounding the system.",
        "C) The presence of nearby shadow-casting structures.",
        "D) The distance of the installation from the power grid.",
        "E) The volume of electricity consumed by the household."
      ],
      correct_answers: ["A", "B", "C"]
    }
  },

  {
    module: "reading",
    task_type: "reorder-paragraphs",
    title: "Reorder — Scientific Method",
    difficulty: "medium",
    content: {
      paragraphs: [
        { id: "A", text: "Finally, they publish their findings in peer-reviewed journals so other scientists can verify the conclusions." },
        { id: "B", text: "To test this hypothesis, they design and execute controlled experiments, collecting empirical data." },
        { id: "C", text: "First, scientists make initial observations about a phenomenon and formulate a research question." },
        { id: "D", text: "Then, they propose a testable hypothesis that serves as a temporary explanation for their observations." }
      ],
      correct_order: ["C", "D", "B", "A"]
    }
  },
  {
    module: "reading",
    task_type: "reorder-paragraphs",
    title: "Reorder — Coffee History",
    difficulty: "easy",
    content: {
      paragraphs: [
        { id: "A", text: "From Yemen, coffee cultivation quickly spread across the Middle East and Persia." },
        { id: "B", text: "By the seventeenth century, European travelers brought the popular beverage back to their home countries." },
        { id: "C", text: "Legend has it that an Ethiopian goatherd first discovered the stimulating effects of coffee beans." },
        { id: "D", text: "He shared his discovery with local monks, who began brewing it to stay awake during long prayers." }
      ],
      correct_order: ["C", "D", "A", "B"]
    }
  },
  {
    module: "reading",
    task_type: "reorder-paragraphs",
    title: "Reorder — Rocket Propulsion",
    difficulty: "hard",
    content: {
      paragraphs: [
        { id: "A", text: "This downward expulsion of gas generates a massive upward reaction force." },
        { id: "B", text: "Inside the combustion chamber, liquid propellants mix and ignite under extreme pressure." },
        { id: "C", text: "According to Newton's third law of motion, every action has an equal and opposite reaction." },
        { id: "D", text: "The resulting high-temperature gases are then ejected rapidly through the exhaust nozzle." }
      ],
      correct_order: ["C", "B", "D", "A"]
    }
  },

  {
    module: "reading",
    task_type: "reading-fill-in-the-blanks",
    title: "Reading Blanks — Ecosystem Balance",
    difficulty: "medium",
    content: {
      passage_with_blanks: "Predators play a key role in maintaining ecosystem structure. By [blank_0] prey populations, they prevent any single species from [blank_1] resources. This allows a wider variety of plants and animals to [blank_2] in the environment.",
      dropdown_choices: {
        blank_0: ["controlling", "expanding", "ignoring", "feeding"],
        blank_1: ["dominating", "sharing", "wasting", "creating"],
        blank_2: ["coexist", "suffer", "flee", "reproduce"]
      },
      answers: {
        blank_0: "controlling",
        blank_1: "dominating",
        blank_2: "coexist"
      }
    }
  },
  {
    module: "reading",
    task_type: "reading-fill-in-the-blanks",
    title: "Reading Blanks — Urbanization",
    difficulty: "hard",
    content: {
      passage_with_blanks: "As cities grow, urban heat islands become more [blank_0]. Paved roads and concrete structures absorb heat, [blank_1] local temperatures compared to surrounding rural areas. To combat this, urban planners are [blank_2] green roofs and planting trees.",
      dropdown_choices: {
        blank_0: ["pronounced", "unimportant", "invisible", "expensive"],
        blank_1: ["elevating", "cooling", "stabilizing", "estimating"],
        blank_2: ["promoting", "banning", "removing", "selling"]
      },
      answers: {
        blank_0: "pronounced",
        blank_1: "elevating",
        blank_2: "promoting"
      }
    }
  },

  {
    module: "reading",
    task_type: "multiple-choice-single",
    title: "MCQ Single — Electric Vehicles",
    difficulty: "easy",
    content: {
      passage: "The growth of electric vehicles (EVs) has surged due to falling battery costs and government incentives. While early EVs had limited driving ranges, modern models frequently exceed 300 miles on a single charge. However, expanding the public charging infrastructure remains a key bottleneck to mass adoption.",
      question: "What is currently identified as the main obstacle to widespread EV adoption?",
      options: [
        "A) Prohibitively high battery replacement costs.",
        "B) Short driving ranges of modern electric vehicles.",
        "C) Insufficient availability of public charging stations.",
        "D) A complete lack of government tax incentives."
      ],
      correct_answers: ["C"]
    }
  },
  {
    module: "reading",
    task_type: "multiple-choice-single",
    title: "MCQ Single — Deep Ocean Exploration",
    difficulty: "medium",
    content: {
      passage: "Exploring the deep ocean presents massive engineering challenges due to extreme hydrostatic pressure and total absence of light. Robotic submersibles must be built with thick titanium hulls and equipped with advanced acoustic sensors to map the seabed, as radio waves cannot penetrate water effectively.",
      question: "Why do submersibles use acoustic sensors instead of radio waves?",
      options: [
        "A) Radio signals are too expensive to generate underwater.",
        "B) Radio waves do not travel effectively through water.",
        "C) Acoustic sensors are much lighter than radio antennae.",
        "D) Hydrostatic pressure damages radio transmitters."
      ],
      correct_answers: ["B"]
    }
  },

  // 🎧 LISTENING (7 types — implement scoring)
  {
    module: "listening",
    task_type: "summarize-spoken-text",
    title: "Summarize Spoken — Macroeconomics",
    difficulty: "medium",
    content: {
      audio_transcript: "Macroeconomics studies the behavior of an economy as a whole, focusing on aggregates like gross domestic product, unemployment rates, and inflation. By analyzing these metrics, central banks adjust interest rates to maintain price stability and foster employment. During a recession, for example, lowering rates encourages borrowing, stimulating consumer spending and business investment.",
      model_answer: "The lecture explained that macroeconomics focuses on aggregate indicators like GDP, inflation, and unemployment. Central banks manage these through interest rate adjustments to stabilize prices and support employment, lowering rates during recessions to encourage borrowing and stimulate economic activity."
    }
  },
  {
    module: "listening",
    task_type: "summarize-spoken-text",
    title: "Summarize Spoken — Quantum Computing",
    difficulty: "hard",
    content: {
      audio_transcript: "Unlike classical computers that represent data as bits (zeros or ones), quantum computers use qubits, which can exist in a superposition of states. Superposition and entanglement enable quantum systems to process complex calculations exponentially faster than silicon chips, potentially revolutionizing cryptography, materials science, and pharmaceutical research.",
      model_answer: "The speaker discussed quantum computing, noting that it utilizes qubits which exist in superposition and entanglement, unlike classical bits. This enables processing complex calculations exponentially faster, promising major breakthroughs in fields like cryptography and drug discovery."
    }
  },

  {
    module: "listening",
    task_type: "multiple-choice-multiple",
    title: "Listening MCQ Multiple — Industrial Revolution",
    difficulty: "medium",
    content: {
      audio_transcript: "The Industrial Revolution marked a fundamental shift from agrarian economies to industrialized manufacturing. Driven by the steam engine and coal power, factories sprung up across Britain, drawing rural workers to cities. This rapid urbanization resulted in dense, unsanitary housing, but it also spurred public health reforms and the development of modern transport infrastructure like railways.",
      question: "According to the speaker, what were key consequences of the Industrial Revolution?",
      options: [
        "A) A widespread movement of workers from urban centers to rural farms.",
        "B) The establishment of factories powered by steam and coal.",
        "C) Rapid urban growth leading to overcrowded, unsanitary living conditions.",
        "D) Immediate decrease in overall demand for transport infrastructure.",
        "E) The complete rejection of public health reforms."
      ],
      correct_answers: ["B", "C"]
    }
  },

  {
    module: "listening",
    task_type: "fill-in-the-blanks",
    title: "Listening Blanks — Biology Lecture",
    difficulty: "medium",
    content: {
      audio_transcript: "DNA replication is a fundamental process in all living organisms. During replication, the double helix structure unwinds, and enzymes synthesize new complementary strands using the original DNA as a template. This ensures that genetic information is accurately transmitted during cell division.",
      audio_transcript_with_blanks: "DNA replication is a [blank_0] process in all living organisms. During replication, the double helix structure [blank_1], and enzymes synthesize new complementary strands using the original DNA as a [blank_2]. This ensures that genetic information is accurately transmitted during cell division.",
      answers: {
        blank_0: "fundamental",
        blank_1: "unwinds",
        blank_2: "template"
      }
    }
  },
  {
    module: "listening",
    task_type: "fill-in-the-blanks",
    title: "Listening Blanks — Public Speaking",
    difficulty: "easy",
    content: {
      audio_transcript: "To deliver a successful presentation, speakers must maintain eye contact with the audience. Speaking clearly at a moderate pace helps listeners absorb key points, while body language can reinforce the message.",
      audio_transcript_with_blanks: "To deliver a successful presentation, speakers must maintain [blank_0] contact with the audience. Speaking [blank_1] at a moderate pace helps listeners absorb key points, while body [blank_2] can reinforce the message.",
      answers: {
        blank_0: "eye",
        blank_1: "clearly",
        blank_2: "language"
      }
    }
  },

  {
    module: "listening",
    task_type: "multiple-choice-single",
    title: "Listening MCQ Single — Volcanic Eruptions",
    difficulty: "easy",
    content: {
      audio_transcript: "Volcanoes erupt when magma rises from the Earth's mantle through the crust. The explosiveness of an eruption depends heavily on the silica content and gas volume of the magma. High-silica magma is thick, trapping gas bubbles and building immense pressure until it bursts violently, whereas low-silica magma flows smoothly as runny lava.",
      question: "What primary factor determines whether a volcanic eruption will be explosive?",
      options: [
        "A) The height of the volcanic cone.",
        "B) The silica content and gas volume in the magma.",
        "C) The temperature of the surrounding air.",
        "D) The geological age of the tectonic plate."
      ],
      correct_answers: ["B"]
    }
  },

  {
    module: "listening",
    task_type: "select-missing-word",
    title: "Select Missing Word — Artificial Intelligence Ethics",
    difficulty: "medium",
    content: {
      audio_transcript: "As neural networks grow increasingly complex, understanding their decision-making processes becomes difficult. This opacity has led to demands for explainable AI, ensuring that algorithmic models are not just accurate, but also transparent and...",
      options: [
        "A) Expensive",
        "B) Accountable",
        "C) Hidden",
        "D) Outdated"
      ],
      correct_answers: ["B"]
    }
  },
  {
    module: "listening",
    task_type: "select-missing-word",
    title: "Select Missing Word — Space Probe",
    difficulty: "hard",
    content: {
      audio_transcript: "The Voyager space probes have traveled past the outer planets and entered interstellar space. Despite their aging nuclear batteries, they continue to transmit data back to Earth, proving that human engineering can survive the harshest...",
      options: [
        "A) Oceans",
        "B) Environments",
        "C) Deserts",
        "D) Labs"
      ],
      correct_answers: ["B"]
    }
  },

  {
    module: "listening",
    task_type: "highlight-incorrect-words",
    title: "Highlight Incorrect Words — Scientific Theories",
    difficulty: "medium",
    content: {
      correct_transcript: "A scientific theory is a well-substantiated explanation of some aspect of the natural world, acquired through the scientific method and repeatedly tested and confirmed.",
      passage_with_incorrect_words: "A scientific theater is a well-substantiated expansion of some aspect of the natural world, acquired through the scientific method and repeatedly tested and confirmed.",
      incorrect_words: ["theater", "expansion"]
    }
  },
  {
    module: "listening",
    task_type: "highlight-incorrect-words",
    title: "Highlight Incorrect Words — Ocean Currents",
    difficulty: "hard",
    content: {
      correct_transcript: "Ocean currents are driven by wind, water density differences, and the Earth's rotation, playing a vital role in regulating the global climate system.",
      passage_with_incorrect_words: "Ocean currents are drawn by wind, water depth differences, and the Earth's rotation, playing a vital role in regulating the global weather system.",
      incorrect_words: ["drawn", "depth", "weather"]
    }
  },

  {
    module: "listening",
    task_type: "write-from-dictation",
    title: "Write from Dictation — Academic Honesty",
    difficulty: "easy",
    content: {
      sentence: "Academic honesty is essential for all students at the university."
    }
  },
  {
    module: "listening",
    task_type: "write-from-dictation",
    title: "Write from Dictation — Group Collaboration",
    difficulty: "medium",
    content: {
      sentence: "Collaborative research project assignments require active participation from every group member."
    }
  },
  {
    module: "listening",
    task_type: "write-from-dictation",
    title: "Write from Dictation — Inflation Rates",
    difficulty: "hard",
    content: {
      sentence: "Economists analyze current inflation rates to predict future financial trends."
    }
  }
];

async function seed() {
  console.log("Starting database seeding for AuraPTE questions...");
  
  try {
    // 1. Delete existing questions to avoid duplicates on re-run
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .neq("module", "null"); // deletes all

    if (deleteError) {
      console.error("Error clearing existing questions:", deleteError.message);
    } else {
      console.log("Cleared existing questions.");
    }

    // 2. Insert new questions
    const { data, error } = await supabase
      .from("questions")
      .insert(questions)
      .select();

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${data.length} questions across Speaking, Writing, Reading, and Listening modules!`);
  } catch (err) {
    console.error("Seeding failed:", err.message || err);
    process.exit(1);
  }
}

seed();
