// Smart Goal Handling System - Add to activityDatabase.js

// ============================================
// VAGUE GOAL DETECTION & HANDLING
// ============================================

const vagueGoalPatterns = {
  // Pattern → suggested categories mapping
  'success': {
    keywords: ['successful', 'success', 'achieve', 'achievement'],
    suggestedCategories: ['business', 'publicSpeaking', 'mathematics', 'writing'],
    clarificationPrompt: "Success means different things to everyone. Is your child interested in academic success, business success, creative success, or something else?"
  },
  
  'confidence': {
    keywords: ['confident', 'confidence', 'self esteem', 'self-esteem'],
    suggestedCategories: ['publicSpeaking', 'performingArts', 'sports', 'martialArts'],
    clarificationPrompt: "Building confidence works best through hands-on activities. Would your child enjoy public speaking, performing arts, sports, or martial arts?"
  },
  
  'social': {
    keywords: ['make friends', 'popular', 'social skills', 'be liked', 'get along'],
    suggestedCategories: ['sports', 'performingArts', 'activism', 'teaching'],
    clarificationPrompt: "Social skills grow through group activities. Would your child enjoy team sports, theater, community service, or helping others learn?"
  },
  
  'academic': {
    keywords: ['good grades', 'do well in school', 'smart', 'intelligent', 'study better'],
    suggestedCategories: ['mathematics', 'writing', 'teaching', 'publicSpeaking'],
    clarificationPrompt: "Academic success can be built through many paths. Is your child strongest in math/science, reading/writing, or would they benefit from tutoring others?"
  },
  
  'college': {
    keywords: ['prepare for college', 'get into college', 'college prep', 'college ready'],
    suggestedCategories: ['mathematics', 'writing', 'publicSpeaking', 'business'],
    clarificationPrompt: "College prep works best when focused on specific strengths. What subjects or activities does your child excel at or enjoy most?"
  },
  
  'creative': {
    keywords: ['be creative', 'more creative', 'creativity', 'artistic', 'find passion'],
    suggestedCategories: ['visualArts', 'music', 'writing', 'performingArts'],
    clarificationPrompt: "Creativity can be expressed in many ways. Would your child enjoy visual arts, music, creative writing, or performing?"
  },
  
  'fitness': {
    keywords: ['be fit', 'get fit', 'strong', 'healthy', 'exercise', 'be active'],
    suggestedCategories: ['sports', 'martialArts', 'emergencyServices', 'performingArts'],
    clarificationPrompt: "Physical fitness is important! Would your child prefer team sports, martial arts, dance, or strength training?"
  },
  
  'career': {
    keywords: ['get a job', 'good job', 'career', 'build resume', 'work experience'],
    suggestedCategories: ['business', 'teaching', 'activism', 'journalism'],
    clarificationPrompt: "Building career skills starts early. Is your child interested in business/entrepreneurship, helping others, communication, or something specific?"
  },
  
  'famous': {
    keywords: ['be famous', 'famous', 'celebrity', 'star', 'influencer'],
    suggestedCategories: ['performingArts', 'music', 'filmmaking', 'gaming'],
    clarificationPrompt: "Many paths can lead to recognition! Is your child drawn to performing, music, content creation, or competitive gaming?"
  },
  
  'wellRounded': {
    keywords: ['well rounded', 'well-rounded', 'diverse skills', 'many things', 'everything'],
    suggestedCategories: ['enrichment', 'sports', 'visualArts', 'music'],
    clarificationPrompt: "Developing multiple skills is great! Let's start with one area of interest. What does your child already enjoy or want to try first?"
  }
};

/**
 * Detects if a goal is too vague and needs clarification
 * @param {string} goalText - The user's goal input
 * @returns {Object|null} - Returns pattern info if vague, null if specific
 */
export function detectVagueGoal(goalText) {
  if (!goalText || typeof goalText !== 'string') return null;
  
  const lower = goalText.toLowerCase().trim();
  
  // Too short and vague
  if (lower.split(' ').length <= 3) {
    for (const [patternName, pattern] of Object.entries(vagueGoalPatterns)) {
      for (const keyword of pattern.keywords) {
        if (lower.includes(keyword)) {
          return {
            type: patternName,
            suggestedCategories: pattern.suggestedCategories,
            clarificationPrompt: pattern.clarificationPrompt,
            originalGoal: goalText
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Gets a curated multi-category plan for vague goals
 * @param {string} patternType - The type of vague goal detected
 * @returns {Array} - Array of activity categories with rationale
 */
export function getMultiCategoryPlan(patternType) {
  const pattern = vagueGoalPatterns[patternType];
  if (!pattern) return null;
  
  const plan = {
    type: patternType,
    prompt: pattern.clarificationPrompt,
    categories: pattern.suggestedCategories.map(categoryKey => {
      const activities = activityDatabase[categoryKey];
      return {
        key: categoryKey,
        name: getCategoryDisplayName(categoryKey),
        activities: activities,
        why: getCategoryRationale(categoryKey, patternType)
      };
    })
  };
  
  return plan;
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(categoryKey) {
  const names = {
    business: 'Business & Entrepreneurship',
    publicSpeaking: 'Public Speaking & Debate',
    mathematics: 'Mathematics',
    writing: 'Writing & Literature',
    sports: 'Sports & Athletics',
    martialArts: 'Martial Arts',
    performingArts: 'Performing Arts',
    visualArts: 'Visual Arts',
    music: 'Music',
    activism: 'Community Service & Activism',
    teaching: 'Teaching & Mentoring',
    filmmaking: 'Film & Video Making',
    gaming: 'Gaming & Esports',
    emergencyServices: 'Emergency Services & First Aid',
    journalism: 'Journalism & Media',
    enrichment: 'General Enrichment'
  };
  return names[categoryKey] || categoryKey;
}

/**
 * Get rationale for why this category helps with the vague goal
 */
function getCategoryRationale(categoryKey, patternType) {
  const rationales = {
    success: {
      business: "Builds entrepreneurial mindset and leadership skills",
      publicSpeaking: "Develops communication and confidence",
      mathematics: "Strengthens analytical thinking and problem-solving",
      writing: "Improves expression and critical thinking"
    },
    confidence: {
      publicSpeaking: "Overcome fear of judgment through practice",
      performingArts: "Express yourself and find your voice",
      sports: "Build physical confidence and teamwork",
      martialArts: "Develop discipline, focus, and self-defense skills"
    },
    social: {
      sports: "Team activities naturally build friendships",
      performingArts: "Collaborate with others on creative projects",
      activism: "Connect with like-minded peers through service",
      teaching: "Help others while developing social skills"
    },
    academic: {
      mathematics: "Build strong foundation in STEM subjects",
      writing: "Improve communication across all subjects",
      teaching: "Teaching others reinforces your own learning",
      publicSpeaking: "Present ideas clearly and confidently"
    },
    college: {
      mathematics: "Essential for standardized tests and many majors",
      writing: "Critical for applications and college-level work",
      publicSpeaking: "Stand out in interviews and presentations",
      business: "Develop leadership experience for applications"
    },
    creative: {
      visualArts: "Express ideas through drawing, painting, sculpture",
      music: "Create and perform original compositions",
      writing: "Tell stories and share your imagination",
      performingArts: "Bring characters and emotions to life"
    },
    fitness: {
      sports: "Stay active while building team skills",
      martialArts: "Develop strength, flexibility, and discipline",
      emergencyServices: "Train for physical challenges and help others",
      performingArts: "Dance and movement for fitness and expression"
    },
    career: {
      business: "Learn entrepreneurship and business fundamentals",
      teaching: "Gain experience helping and mentoring others",
      activism: "Build leadership through community involvement",
      journalism: "Develop research and communication skills"
    },
    famous: {
      performingArts: "Build stage presence and acting skills",
      music: "Develop musical talent and performance ability",
      filmmaking: "Create content and build an audience",
      gaming: "Compete professionally or stream content"
    },
    wellRounded: {
      enrichment: "Explore diverse interests and find your passion",
      sports: "Stay active and develop teamwork",
      visualArts: "Express creativity through art",
      music: "Learn an instrument or vocal skills"
    }
  };
  
  return rationales[patternType]?.[categoryKey] || "Develops valuable life skills";
}

// ============================================
// ENHANCED getActivityPlan FUNCTION
// ============================================

/**
 * Enhanced version that handles vague goals intelligently
 */
export function getActivityPlanEnhanced(goalText) {
  // Check if goal is vague
  const vagueGoalInfo = detectVagueGoal(goalText);
  
  if (vagueGoalInfo) {
    return {
      isVague: true,
      originalGoal: goalText,
      clarificationPrompt: vagueGoalInfo.clarificationPrompt,
      multiCategoryPlan: getMultiCategoryPlan(vagueGoalInfo.type)
    };
  }
  
  // Normal specific goal - use existing logic
  return {
    isVague: false,
    activities: getActivityPlan(goalText),
    category: getCategoryName(goalText)
  };
}

// ============================================
// EXAMPLE USAGE IN UI
// ============================================

/*
// In your AddGoalScreen or wherever goals are entered:

const handleGoalSubmit = (goalText) => {
  const result = getActivityPlanEnhanced(goalText);
  
  if (result.isVague) {
    // Show clarification UI
    showClarificationModal({
      prompt: result.clarificationPrompt,
      suggestions: result.multiCategoryPlan.categories,
      onSelect: (specificGoal) => {
        // User picked a specific category
        proceedWithSpecificGoal(specificGoal);
      },
      onCustomInput: () => {
        // Let user refine their goal
        showGoalRefinementInput();
      }
    });
  } else {
    // Proceed normally with specific goal
    proceedWithActivities(result.activities, result.category);
  }
};
*/