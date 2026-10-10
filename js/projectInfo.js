"use strict";

// Website/project facts only. No PDFs or medical reference retrieval are used here.
// Keep unknown values null so the assistant can decline rather than guess.
window.KneeOsteoProjectInfo = {
  project: {
    academicTitle: "A Multimodel Deep Learning Framework for Osteoporosis Detection",
    applicationName: "KneeOsteo AI",
    description: "Knee Osteo AI is an AI-assisted knee X-ray classification research prototype for osteoporosis-related screening and research.",
    overview: "Knee Osteo AI is a medical imaging AI application developed as part of the academic project ‘A Multimodel Deep Learning Framework for Osteoporosis Detection.’ The system analyzes knee X-ray images using a deep learning architecture based on DenseNet121 combined with a Single-Token Transformer. The model classifies input into Normal, Osteopenia, or Osteoporosis. The website supports uploading and analyzing knee X-rays, viewing the AI prediction and confidence, exploring the model architecture, and asking project-information and general medical questions. It is an AI-assisted research/screening tool, not a replacement for professional medical diagnosis.",
    objective: "Analyze knee X-ray images and classify them as Normal, Osteopenia, or Osteoporosis using DenseNet121 with a Single-Token Transformer. It is an AI-assisted screening/research tool, not a replacement for professional medical diagnosis.",
    purpose: null,
    futureScope: null
  },
  developer: { name: "Dileep Kumar Akula", role: "Project Team Lead" },
  team: [
    { name: "Dileep Kumar Akula", role: "Project Team Lead" },
    { name: "Devendra Prasad R", role: "Project Team Member" }
  ],
  mentor: {
    name: "Dr. J. Avinash",
    designation: "Associate Professor",
    department: "Department of CSE (AI&ML)"
  },
  institution: {
    college: "RGM College of Engineering and Technology (RGMCET), Nandyal",
    department: "CSE (Artificial Intelligence & Machine Learning)"
  },
  contact: {
    dileep: { instagram: "@dileeeeep._.royal", email: "dileepakula2007@gmail.com", mobile: "7093896189", linkedin: "https://www.linkedin.com/in/dileepakula" },
    devendra: { email: "devendraprasad415@gmail.com", mobile: "7032143350", linkedin: "https://www.linkedin.com/in/ramayanapudevendra" }
  },
  model: {
    architecture: "DenseNet121 + Single-Token Transformer",
    inputSize: "224 × 224 pixels",
    classes: ["Normal", "Osteopenia", "Osteoporosis"]
  },
  dataset: {
    description: null,
    source: null,
    size: null,
    splitDetails: "The existing website reports evaluation on a held-out test dataset; its size and split details are not available in the checked-in project files."
  },
  technologies: ["HTML", "CSS", "JavaScript", "Python", "Flask", "ONNX Runtime", "Bootstrap"],
  workflow: [
    "The user selects a JPG or PNG knee X-ray in the existing upload interface.",
    "The local service checks file format and basic image quality; it does not verify knee anatomy.",
    "The image is prepared at 224 × 224 pixels with RGB/ImageNet normalization.",
    "The DenseNet121 + Single-Token Transformer model returns one of three classes and class scores.",
    "The website displays an AI-assisted report and a coarse occlusion-sensitivity visualization."
  ],
  results: {
    testAccuracy: "84.28%",
    macroF1: "84.10%",
    validationAccuracy: "88.52%",
    validationMacroF1: "88.46%",
    classF1: { normal: "85.39%", osteopenia: "86.34%", osteoporosis: "80.57%" },
    note: "Latest approved experiment results."
  },
  features: [
    "JPG/PNG X-ray upload and local preview",
    "Local model analysis with three class scores",
    "Image-quality checks",
    "Occlusion-sensitivity visualization",
    "AI-assisted result report"
  ],
  limitations: [
    "This is a research/educational prototype, not a diagnostic device.",
    "Image-quality checks do not verify that an image contains a knee.",
    "The model has no dedicated out-of-distribution or knee-view validator.",
    "Model confidence is not a clinical probability or confirmed diagnosis.",
    "The occlusion-sensitivity visualization is not a lesion location or clinical proof."
  ],
  knowledge: [
    {
      topics: ["explain about project", "explain the project", "tell me about project", "tell me about the project", "project overview", "what is the project", "what does the project do", "project objective", "what is the objective", "why was this project developed", "what problem does the project solve", "about the project", "explain knee osteo ai"],
      answer: "Knee Osteo AI is an AI-assisted research and screening prototype for classifying knee X-ray images. It addresses the project goal of supporting osteoporosis-related image analysis by predicting one of three classes: Normal, Osteopenia, or Osteoporosis. Its architecture combines DenseNet121 with a Single-Token Transformer. The website accepts an X-ray, prepares it for model analysis, and displays the predicted class and scores. The output is for research/education and is not a replacement for a professional medical diagnosis."
    },
    {
      topics: ["official project title", "academic title", "academic project", "project title", "project called", "what is this project", "what is this academic project", "what is the project", "what is the project about"],
      answer: "The official academic project title is “A Multimodel Deep Learning Framework for Osteoporosis Detection.” The existing website/application is named “KneeOsteo AI.”"
    },
    {
      topics: ["application name", "website name", "website", "app name"],
      answer: "The existing website/application is named “KneeOsteo AI.” The official academic project title is “A Multimodel Deep Learning Framework for Osteoporosis Detection.”"
    },
    {
      topics: ["description", "purpose", "what is this website"],
      answer: "Knee Osteo AI is an AI-assisted knee X-ray classification research prototype. It predicts Normal, Osteopenia, or Osteoporosis using DenseNet121 with a Single-Token Transformer; its output is not a medical diagnosis."
    },
    {
      topics: ["objective", "goal", "aim", "project objective"],
      answer: null
    },
    {
      topics: ["team members", "who developed", "who created", "developer", "team"],
      answer: "The project team is Dileep Kumar Akula (Project Team Lead) and Devendra Prasad R (Project Team Member)."
    },
    {
      topics: ["who is the team lead", "team lead", "lead developer", "tell me about dileep"],
      answer: "Dileep Kumar Akula is the Project Team Lead."
    },
    {
      topics: ["who is the other team member", "devendra", "team member"],
      answer: "Devendra Prasad R is a Project Team Member."
    },
    {
      topics: ["mentor", "guide", "supervisor"],
      answer: "The project mentor is Dr. J. Avinash, Associate Professor, Department of CSE (AI&ML)."
    },
    {
      topics: ["college", "university", "institution"],
      answer: "RGM College of Engineering and Technology (RGMCET), Nandyal."
    },
    {
      topics: ["department", "branch"],
      answer: "CSE (Artificial Intelligence & Machine Learning). The mentor’s department is listed as Department of CSE (AI&ML)."
    },
    {
      topics: ["model", "architecture", "densenet", "transformer", "network"],
      answer: "The project uses DenseNet121 with a Single-Token Transformer. The model input is 224 × 224 pixels."
    },
    {
      topics: ["classes", "class labels", "categories", "prediction labels"],
      answer: "The model classes are Normal, Osteopenia, and Osteoporosis."
    },
    {
      topics: ["dataset source", "where is the dataset from", "dataset origin"],
      answer: null
    },
    {
      topics: ["dataset size", "how many images", "number of images", "dataset count"],
      answer: null
    },
    {
      topics: ["dataset", "training data", "training details", "validation split", "test split", "evaluation split"],
      answer: "The existing website reports evaluation on a held-out test dataset. Its source, size, and train/validation/test split details are not available in the checked-in project files."
    },
    {
      topics: ["technologies", "technology", "tech stack", "programming languages", "software"],
      answer: "The existing project uses HTML, CSS, JavaScript, Bootstrap, Python, Flask, and ONNX Runtime."
    },
    {
      topics: ["workflow", "how does it work", "prediction process", "how prediction happens", "how does the prediction happen", "how does prediction work", "analysis steps"],
      answer: "The user uploads a JPG or PNG X-ray; the local service checks its format and basic image quality, preprocesses it, and runs the DenseNet121 + Transformer model. The site then displays the predicted class, class scores, an occlusion-sensitivity visualization, and an AI-assisted report. The checks do not verify knee anatomy."
    },
    {
      topics: ["accuracy", "test accuracy", "results", "performance", "f1", "macro f1", "score"],
      answer: "Latest approved results: test accuracy 84.28%, test macro F1 84.10%, validation accuracy 88.52%, and validation macro F1 88.46%. Class F1: Normal 85.39%, Osteopenia 86.34%, and Osteoporosis 80.57%. These are project model metrics, not an individual patient’s medical probability."
    },
    {
      topics: ["features", "website features", "what can the website do"],
      answer: "The website supports JPG/PNG upload and preview, local model analysis, image-quality checks, three-class scores, an occlusion-sensitivity visualization, and an AI-assisted report."
    },
    {
      topics: ["limitations", "limitations of the model", "is this a diagnosis", "medical diagnosis"],
      answer: "This is a research/educational prototype, not a diagnostic device. Its image checks do not verify knee anatomy, and it has no dedicated out-of-distribution or knee-view validator. Model confidence is not a clinical probability or confirmed diagnosis."
    },
    {
      topics: ["future scope", "future work", "future improvements"],
      answer: null
    },
    {
      topics: ["team contact details", "contact details", "contact information"],
      answer: "Ask for a specific team member and contact method (for example, Dileep’s email or Devendra’s LinkedIn), and I’ll provide only that detail."
    }
  ]
};
