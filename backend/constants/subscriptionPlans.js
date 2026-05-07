const PLANS = {
    FREE_TRAINER: {
      id: 'FREE_TRAINER',
      label: 'Free Trainer',
      audience: 'trainer',
      priceChf: 0,
      monthlyCallQuota: 0,       // no AI calls
      features: {
        aiEnabled: false,
        sharingEnabled: false,
        rawDataExport: false,
        unlimitedUsers: false,
      },
    },
  
    PRO_TRAINER: {
      id: 'PRO_TRAINER',
      label: 'Pro Trainer',
      audience: 'trainer',
      priceChf: 9.90,
      monthlyCallQuota: 1500,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: false,
      },
    },
  
    PRO_PLUS_TRAINER: {
      id: 'PRO_PLUS_TRAINER',
      label: 'Pro+ Trainer',
      audience: 'trainer',
      priceChf: 17.90,
      monthlyCallQuota: 5000,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: false,
      },
    },
  
    ULTRA_TRAINER: {
      id: 'ULTRA_TRAINER',
      label: 'Ultra Trainer',
      audience: 'trainer',
      priceChf: 79.90,
      monthlyCallQuota: 30000,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: false,
      },
    },
  
    FREE_TEACHER: {
      id: 'FREE_TEACHER',
      label: 'Free Teacher',
      audience: 'teacher',
      priceChf: 0,
      monthlyCallQuota: 0,       // AI only if inside a Pro+ trainer's shared monitoring
      features: {
        aiEnabled: false,         // enabled contextually via shared monitoring
        sharingEnabled: false,
        rawDataExport: false,
        unlimitedUsers: false,
      },
    },
  
    PRO_TEACHER: {
      id: 'PRO_TEACHER',
      label: 'Pro Teacher',
      audience: 'teacher',
      priceChf: 4.90,
      monthlyCallQuota: 750,
      features: {
        aiEnabled: true,
        sharingEnabled: false,
        rawDataExport: true,
        unlimitedUsers: false,
      },
    },
  
    INSTITUTION_XS: {
      id: 'INSTITUTION_XS',
      label: 'Institution XS',
      audience: 'institution',
      priceChf: 249,
      monthlyCallQuota: 30000,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: true,
      },
    },
  
    INSTITUTION_S: {
      id: 'INSTITUTION_S',
      label: 'Institution S',
      audience: 'institution',
      priceChf: 490,
      monthlyCallQuota: 80000,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: true,
      },
    },
  
    INSTITUTION_M: {
      id: 'INSTITUTION_M',
      label: 'Institution M',
      audience: 'institution',
      priceChf: 990,
      monthlyCallQuota: 200000,
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: true,
      },
    },
  
    RESEARCH: {
      id: 'RESEARCH',
      label: 'Research',
      audience: 'research',
      priceChf: 0,               // custom contract — set per agreement
      monthlyCallQuota: 0,       // set at institution level
      features: {
        aiEnabled: true,
        sharingEnabled: true,
        rawDataExport: true,
        unlimitedUsers: true,
      },
    },
  };
  
  /**
   * Returns the plan config for a given plan ID.
   * Falls back to FREE_TRAINER if the ID is unknown.
   */
  function getPlan(planId) {
    return PLANS[planId] || PLANS.FREE_TRAINER;
  }
  
  const TRIAL_DURATION_DAYS = 14;
  
    /** Returns true if one more AI call is allowed within the monthly included quota. */
    function canMakeAiCall(plan, usedThisMonth) {
      const quota = plan.monthlyCallQuota;
      if (quota <= 0) return false;
      return usedThisMonth < quota;
    }
  
    module.exports = { PLANS, getPlan, TRIAL_DURATION_DAYS, canMakeAiCall };