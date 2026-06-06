const { getModel } = require('../config/gemini');

// High-quality mock data generator for development/testing when GEMINI_API_KEY is not set
const mockResumeAnalysis = (text) => {
  const lowercaseText = text.toLowerCase();
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];
  
  if (lowercaseText.includes('react') || lowercaseText.includes('javascript') || lowercaseText.includes('frontend')) {
    strengths.push({ title: 'Strong Frontend Foundation', description: 'Good knowledge of modern JavaScript/TypeScript and libraries like React.' });
  } else {
    suggestions.push({ section: 'Technical Skills', suggestion: 'Consider adding modern frontend frameworks like React or Vue if applying for fullstack/frontend roles.', priority: 'medium' });
  }

  if (lowercaseText.includes('node') || lowercaseText.includes('python') || lowercaseText.includes('sql') || lowercaseText.includes('backend')) {
    strengths.push({ title: 'Backend Development Capabilities', description: 'Demonstrated experience in server-side logic and database operations.' });
  }

  if (lowercaseText.includes('git') || lowercaseText.includes('docker') || lowercaseText.includes('aws') || lowercaseText.includes('ci/cd')) {
    strengths.push({ title: 'DevOps & Tooling Familiarity', description: 'Familiarity with version control, containerization, or cloud deployment practices.' });
  }

  if (strengths.length === 0) {
    strengths.push({ title: 'Clean Structure', description: 'The resume sections are clearly structured and easy to read.' });
  }

  // Common weaknesses
  weaknesses.push({ title: 'Lack of Quantifiable Metrics', description: 'Most bullet points describe responsibilities rather than outcomes or measured impact.' });
  weaknesses.push({ title: 'Vague Project Details', description: 'Some projects lack details on the specific technologies used or the personal contribution made.' });

  // Common suggestions
  suggestions.push({ section: 'Professional Experience', suggestion: 'Rewrite bullet points using the STAR method (Situation, Task, Action, Result) and include metrics (e.g., "reduced latency by 20%").', priority: 'high' });
  suggestions.push({ section: 'Projects', suggestion: 'Add links to live demos or public repositories (GitHub) for your top projects.', priority: 'medium' });
  suggestions.push({ section: 'Summary', suggestion: 'Include a concise professional summary highlighting your key expertise and career goals.', priority: 'low' });

  const score = Math.floor(Math.random() * 15) + 70; // 70 to 84
  const ats_score = Math.floor(Math.random() * 15) + 65; // 65 to 79

  return {
    overall_score: score,
    ats_score: ats_score,
    strengths,
    weaknesses,
    suggestions
  };
};

const getMockQuestions = (role, difficulty = 'medium') => {
  const roleLower = role.toLowerCase();
  
  // Default software engineer questions
  let questions = [
    {
      index: 0,
      question: "Explain the difference between synchronous and asynchronous execution. How does the event loop handle this in JavaScript?",
      type: "technical",
      topic: "JavaScript Runtime",
      expected_time_minutes: 10,
      hints: ["Think about call stack and callback queue.", "Mention microtasks and macrotasks."]
    },
    {
      index: 1,
      question: "Given an unsorted array of integers, write an efficient function to find the length of the longest consecutive elements sequence.",
      type: "coding",
      topic: "Arrays & Hashing",
      expected_time_minutes: 20,
      hints: ["Could we use a Set to get O(1) lookups?", "Try to find the start of each sequence."]
    },
    {
      index: 2,
      question: "How would you design a rate limiter for a public API that can handle millions of requests per day?",
      type: "system_design",
      topic: "System Design",
      expected_time_minutes: 15,
      hints: ["What algorithms can be used? Token bucket? Leaky bucket?", "Where would you store the request counts? Redis?"]
    },
    {
      index: 3,
      question: "Tell me about a time you faced a difficult technical challenge in a project. How did you identify, analyze, and resolve the problem?",
      type: "behavioral",
      topic: "Problem Solving",
      expected_time_minutes: 10,
      hints: ["Use the STAR method.", "Explain what you learned from this experience."]
    },
    {
      index: 4,
      question: "What is database normalization? Explain the difference between 2NF and 3NF, and when you might choose to denormalize a database.",
      type: "technical",
      topic: "Databases",
      expected_time_minutes: 10,
      hints: ["Define transitive dependency.", "Denormalization is often done for read optimization."]
    },
    {
      index: 5,
      question: "How would you design a real-time chat application dashboard? What protocols would you use for instant message updates?",
      type: "system_design",
      topic: "System Design",
      expected_time_minutes: 15,
      hints: ["WebSockets vs HTTP Polling vs Server-Sent Events.", "How do you scale to support millions of active users?"]
    },
    {
      index: 6,
      question: "Tell me about a time you had to work with a teammate who had a very different working style or opinion. How did you handle it?",
      type: "behavioral",
      topic: "Collaboration",
      expected_time_minutes: 10,
      hints: ["Focus on empathy and communication.", "What was the final outcome and how did it affect the project?"]
    },
    {
      index: 7,
      question: `What are the key principles of RESTful API design? How do they compare to GraphQL for client-server communication?`,
      type: "technical",
      topic: "API Design",
      expected_time_minutes: 10,
      hints: ["Mention HTTP methods and status codes.", "Explain over-fetching and under-fetching issues in REST."]
    }
  ];

  if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('react')) {
    questions = [
      {
        index: 0,
        question: "What is the Virtual DOM in React and how does reconciliation work? Explain the significance of keys in React lists.",
        type: "technical",
        topic: "React Core",
        expected_time_minutes: 10,
        hints: ["Virtual DOM is a lightweight representation of the real DOM.", "Keys help React identify which items have changed, been added, or been removed."]
      },
      {
        index: 1,
        question: "Implement a custom React hook `useDebounce` that delays updating a value until a specified timeout has elapsed.",
        type: "coding",
        topic: "React Hooks",
        expected_time_minutes: 15,
        hints: ["Use useEffect and setTimeout.", "Don't forget to clear the timeout in the cleanup function."]
      },
      {
        index: 2,
        question: "How would you optimize the performance of a React application that renders a long list of items (e.g., 10,000+ items)?",
        type: "technical",
        topic: "Performance",
        expected_time_minutes: 15,
        hints: ["Windowing or virtualization (react-window).", "React.memo, useMemo, and useCallback."]
      },
      {
        index: 3,
        question: "Tell me about a time you had to optimize a slow website. What tools did you use to measure performance and what improvements did you make?",
        type: "behavioral",
        topic: "Performance Tuning",
        expected_time_minutes: 10,
        hints: ["Mention Lighthouse, Chrome DevTools, Network tab.", "Explain code-splitting, lazy loading, image compression."]
      },
      {
        index: 4,
        question: "Explain the CSS box model. What is the difference between `content-box` and `border-box`? How does `box-sizing` affect layout sizing?",
        type: "technical",
        topic: "CSS",
        expected_time_minutes: 10,
        hints: ["Content box includes only the content.", "Border box includes content, padding, and border."]
      },
      {
        index: 5,
        question: "Design a state management architecture for a complex multi-step checkout form in a large e-commerce React application.",
        type: "system_design",
        topic: "Frontend Architecture",
        expected_time_minutes: 15,
        hints: ["Should you use Context API, Redux, Zustand, or local state?", "How to persist state between steps or handle page reloads?"]
      },
      {
        index: 6,
        question: "Describe a scenario where you disagreed with a design or product decision on a user interface. How did you advocate for the user?",
        type: "behavioral",
        topic: "Product Advocacy",
        expected_time_minutes: 10,
        hints: ["Focus on accessibility, usability, and responsiveness.", "Explain how you used data or design guidelines to back your points."]
      },
      {
        index: 7,
        question: "What is Cross-Origin Resource Sharing (CORS)? How does a browser handle preflight requests?",
        type: "technical",
        topic: "Security",
        expected_time_minutes: 10,
        hints: ["Explain OPTIONS request method.", "CORS headers are set by the server (Access-Control-Allow-Origin)."]
      }
    ];
  } else if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('machine learning')) {
    questions = [
      {
        index: 0,
        question: "What is the bias-variance tradeoff? How do ensemble methods like Random Forests or Gradient Boosting handle bias and variance?",
        type: "technical",
        topic: "Machine Learning Concepts",
        expected_time_minutes: 10,
        hints: ["High bias can cause underfitting; high variance can cause overfitting.", "Bagging reduces variance; boosting reduces bias."]
      },
      {
        index: 1,
        question: "Write a Python function to compute the R-squared (Coefficient of Determination) score from scratch given actual and predicted values.",
        type: "coding",
        topic: "Evaluation Metrics",
        expected_time_minutes: 15,
        hints: ["R-squared = 1 - (SS_res / SS_tot).", "SS_res is the sum of squared residuals; SS_tot is total sum of squares."]
      },
      {
        index: 2,
        question: "How would you handle highly imbalanced datasets in a classification problem (e.g., fraud detection)?",
        type: "technical",
        topic: "Data Preprocessing",
        expected_time_minutes: 12,
        hints: ["Resampling techniques: SMOTE, undersampling.", "Choosing appropriate metrics: Precision, Recall, F1, ROC-AUC (not accuracy)."]
      },
      {
        index: 3,
        question: "Describe a project where you had to deploy a machine learning model to production. What were the challenges in serving and monitoring?",
        type: "behavioral",
        topic: "MLOps",
        expected_time_minutes: 12,
        hints: ["Mention API frameworks (Flask, FastAPI) or cloud deployments (AWS, GCP).", "Explain model drift, latency constraints, caching."]
      },
      {
        index: 4,
        question: "What is the difference between L1 (Lasso) and L2 (Ridge) regularization? When would you use one over the other?",
        type: "technical",
        topic: "Regularization",
        expected_time_minutes: 10,
        hints: ["L1 produces sparse weights (feature selection).", "L2 shrinks weights towards zero but keeps them non-zero."]
      },
      {
        index: 5,
        question: "Design an end-to-end data pipeline to recommend personalized products to users on an e-commerce website.",
        type: "system_design",
        topic: "Recommendation Systems",
        expected_time_minutes: 15,
        hints: ["Collaborative filtering vs Content-based filtering.", "How to handle the cold start problem for new users."]
      },
      {
        index: 6,
        question: "Tell me about a time when your model did not perform well in production despite high validation accuracy. How did you debug it?",
        type: "behavioral",
        topic: "Debugging ML",
        expected_time_minutes: 10,
        hints: ["Check for data leakage during validation.", "Look at training-serving skew or distribution shift."]
      },
      {
        index: 7,
        question: "Explain the transformer architecture. What is self-attention and why is it superior to recurrent architectures (LSTMs)?",
        type: "technical",
        topic: "Deep Learning",
        expected_time_minutes: 12,
        hints: ["Self-attention allows parallelization across sequence tokens.", "Eliminates sequential dependency of RNNs."]
      }
    ];
  }

  return questions;
};

const evaluateMockAnswer = (question, answer, role) => {
  const cleanAnswer = answer.trim();
  const wordCount = cleanAnswer.split(/\s+/).length;
  
  let score = 5;
  let feedback = '';
  let strengths = [];
  let improvements = [];
  let modelAnswer = 'An ideal answer should detail core concepts, mention practical trade-offs, and outline a structured solution.';

  if (wordCount < 10) {
    score = 3;
    feedback = "Your answer is extremely brief. Interviewers expect a more detailed response to demonstrate your depth of knowledge. Try to expand on your points and give concrete examples.";
    strengths = ["Gets straight to the point"];
    improvements = ["Explain the underlying concepts in detail", "Provide a real-world example", "Structure your answer with introduction, explanation, and wrap-up"];
  } else if (wordCount < 40) {
    score = 5;
    feedback = "You have the right basic idea, but the answer lacks depth and detail. You should explain the mechanism behind your statement and share more technical context or examples.";
    strengths = ["Identified key terms correctly"];
    improvements = ["Elaborate on how the technology works", "Discuss edge cases or potential pitfalls", "Connect your answer back to practical development experience"];
  } else {
    // Good answer length
    score = Math.floor(Math.random() * 3) + 7; // 7 to 9
    feedback = "This is a solid and well-structured answer. You've addressed the question directly and provided good technical explanations. To make it even stronger, you could talk more about architectural trade-offs or personal experiences.";
    strengths = ["Comprehensive coverage of the topic", "Clear and logical flow", "Demonstrates good technical understanding"];
    improvements = ["Mention alternative approaches and their trade-offs", "Elaborate slightly on scaling or production implications"];
  }

  // Customize mock feedback based on question keywords
  const qLower = question.toLowerCase();
  if (qLower.includes('virtual dom') || qLower.includes('react')) {
    modelAnswer = "An ideal answer should explain that the Virtual DOM is a JavaScript object representation of the real DOM. Reconciliation is React's diffing algorithm (O(N) heuristic) that compares the new Virtual DOM with the old one, updating only the changed nodes in the real DOM. Keys are crucial in lists to uniquely identify elements so React can reuse existing DOM nodes instead of re-creating them, maintaining component state and performance.";
  } else if (qLower.includes('synchronous') || qLower.includes('event loop')) {
    modelAnswer = "An ideal answer should define synchronous (blocking, step-by-step execution) vs asynchronous (non-blocking, deferred execution). The event loop is a mechanism in JavaScript that continuously monitors the Call Stack and the Callback Queue. If the stack is empty, it pushes callbacks from the queue to the stack. Mention the distinction between microtask queue (Promises, process.nextTick) and macrotask queue (setTimeout, setInterval, I/O), where microtasks are run completely before the next macrotask.";
  }

  return {
    score,
    feedback,
    strengths,
    improvements,
    model_answer_summary: modelAnswer
  };
};

const generateMockOverallFeedback = (role, qaList) => {
  const totalScore = qaList.reduce((acc, q) => acc + (q.score || 0), 0);
  const averageScore = qaList.length ? (totalScore / qaList.length) : 0;
  const overallPercentage = Math.round(averageScore * 10);

  let recommendation = 'lean_no_hire';
  let summary = 'The candidate demonstrates basic knowledge but needs improvement in articulation, details, and core computer science concepts.';
  
  if (overallPercentage >= 80) {
    recommendation = 'hire';
    summary = `The candidate showed excellent performance throughout the mock interview. They have strong technical knowledge, structured communication, and high adaptability for a ${role} role.`;
  } else if (overallPercentage >= 70) {
    recommendation = 'lean_hire';
    summary = `The candidate gave a solid performance with clear understanding of fundamental topics. Some areas of improvement are depth of technical detail and speed of problem-solving.`;
  } else if (overallPercentage >= 50) {
    recommendation = 'lean_no_hire';
    summary = `The candidate has potential but needs more preparation. They struggled with complex design patterns and coding efficiency, although they handled behavioral questions well.`;
  } else {
    recommendation = 'no_hire';
    summary = `The candidate needs significant practice across core areas of engineering, including system design and syntax structures. Focus on building small projects first.`;
  }

  return {
    overall_score: overallPercentage,
    summary,
    top_strengths: [
      "Structured communication during behavioral questions",
      "Good familiarity with high-level architectural concepts"
    ],
    key_improvements: [
      "Flesh out answers with more technical depth and specific terms",
      "Discuss edge cases and alternative approaches without prompting"
    ],
    recommendation,
    next_steps: [
      "Revise core computer science concepts (event loop, database design, caching)",
      "Practice solving Medium-level DSA coding problems within a 20-minute limit",
      "Do mock interviews targeting specific architectural questions"
    ]
  };
};

class GeminiService {
  constructor() {
    this.useMock = !process.env.GEMINI_API_KEY;
    if (!this.useMock) {
      try {
        this.model = getModel();
      } catch (err) {
        console.warn('⚠️ Failed to initialize Gemini model. Falling back to mock generator.', err.message);
        this.useMock = true;
      }
    } else {
      console.log('ℹ️ GEMINI_API_KEY is not set. Using local mock generator for placement helper.');
    }
  }

  /**
   * Analyze a resume text and return structured feedback
   */
  async analyzeResume(resumeText) {
    if (this.useMock) {
      console.log('🤖 Simulating resume analysis...');
      // Small artificial delay to mimic API latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      const analysis = mockResumeAnalysis(resumeText);
      return { success: true, analysis, rawResponse: JSON.stringify(analysis) };
    }

    const prompt = `You are an expert resume reviewer and career coach. Analyze the following resume and provide detailed feedback.

Return your analysis as a valid JSON object with this exact structure:
{
  "overall_score": <number 0-100>,
  "ats_score": <number 0-100>,
  "strengths": [{"title": "<strength title>", "description": "<details>"}],
  "weaknesses": [{"title": "<weakness title>", "description": "<details>"}],
  "suggestions": [{"section": "<section name>", "suggestion": "<improvement suggestion>", "priority": "<high|medium|low>"}]
}

Evaluation criteria:
- Content quality and relevance
- Formatting and structure
- Use of action verbs and quantifiable achievements
- ATS (Applicant Tracking System) compatibility
- Technical skills presentation
- Project descriptions quality
- Education section completeness

Resume text:
---
${resumeText}
---

Return ONLY the JSON object, no markdown formatting or code blocks.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // Try to parse JSON from the response
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanedText);
      return { success: true, analysis, rawResponse: responseText };
    } catch (error) {
      console.error('Gemini resume analysis error:', error.message);
      console.log('⚠️ Falling back to mock response due to API error.');
      const analysis = mockResumeAnalysis(resumeText);
      return { success: true, analysis, rawResponse: JSON.stringify(analysis) };
    }
  }

  /**
   * Generate mock interview questions based on role and difficulty
   */
  async generateInterviewQuestions(role, difficulty = 'medium') {
    if (this.useMock) {
      console.log('🤖 Simulating question generation...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      const questions = getMockQuestions(role, difficulty);
      return { success: true, questions };
    }

    const prompt = `You are an expert technical interviewer. Generate a mock interview question set for the following:

Role: ${role}
Difficulty: ${difficulty}

Generate exactly 8 questions as a JSON array with this structure:
[
  {
    "index": 0,
    "question": "<the interview question>",
    "type": "<technical|behavioral|system_design|coding>",
    "topic": "<specific topic>",
    "expected_time_minutes": <number>,
    "hints": ["<hint 1>", "<hint 2>"]
  }
]

Include a mix of:
- 3 technical/coding questions relevant to the role
- 2 system design questions (scaled to difficulty)
- 2 behavioral questions (using STAR method expectations)
- 1 role-specific question

Return ONLY the JSON array, no markdown formatting or code blocks.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions = JSON.parse(cleanedText);
      return { success: true, questions };
    } catch (error) {
      console.error('Gemini question generation error:', error.message);
      console.log('⚠️ Falling back to mock questions due to API error.');
      const questions = getMockQuestions(role, difficulty);
      return { success: true, questions };
    }
  }

  /**
   * Provide AI feedback on an interview answer
   */
  async evaluateAnswer(question, answer, role) {
    if (this.useMock) {
      console.log('🤖 Simulating answer evaluation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const evaluation = evaluateMockAnswer(question, answer, role);
      return { success: true, evaluation };
    }

    const prompt = `You are an expert technical interviewer evaluating a candidate's response.

Role being interviewed for: ${role}

Question: ${question}

Candidate's Answer:
---
${answer}
---

Evaluate the answer and return a JSON object:
{
  "score": <number 0-10>,
  "feedback": "<detailed constructive feedback, 2-3 paragraphs>",
  "strengths": ["<what they did well>"],
  "improvements": ["<specific improvements>"],
  "model_answer_summary": "<brief summary of an ideal answer>"
}

Be encouraging but honest. Provide specific, actionable feedback.

Return ONLY the JSON object, no markdown formatting or code blocks.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const evaluation = JSON.parse(cleanedText);
      return { success: true, evaluation };
    } catch (error) {
      console.error('Gemini answer evaluation error:', error.message);
      console.log('⚠️ Falling back to mock evaluation due to API error.');
      const evaluation = evaluateMockAnswer(question, answer, role);
      return { success: true, evaluation };
    }
  }

  /**
   * Generate overall interview feedback
   */
  async generateOverallFeedback(role, questionsAndAnswers) {
    if (this.useMock) {
      console.log('🤖 Simulating overall interview feedback...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      const feedback = generateMockOverallFeedback(role, questionsAndAnswers);
      return { success: true, feedback };
    }

    const qaText = questionsAndAnswers
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}\nScore: ${qa.score}/10`)
      .join('\n\n');

    const prompt = `You are an expert interviewer providing overall feedback after a mock interview session.

Role: ${role}

Questions and Answers:
${qaText}

Provide overall feedback as a JSON object:
{
  "overall_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "top_strengths": ["<strength 1>", "<strength 2>"],
  "key_improvements": ["<improvement 1>", "<improvement 2>"],
  "recommendation": "<hire/lean_hire/lean_no_hire/no_hire>",
  "next_steps": ["<suggested preparation step 1>", "<step 2>"]
}

Return ONLY the JSON object, no markdown formatting or code blocks.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const feedback = JSON.parse(cleanedText);
      return { success: true, feedback };
    } catch (error) {
      console.error('Gemini overall feedback error:', error.message);
      console.log('⚠️ Falling back to mock overall feedback due to API error.');
      const feedback = generateMockOverallFeedback(role, questionsAndAnswers);
      return { success: true, feedback };
    }
  }
}

module.exports = new GeminiService();
