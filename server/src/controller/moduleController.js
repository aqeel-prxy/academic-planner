const Module = require('../models/Module');

// GET all modules
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.findAll({
      order: [['semester', 'ASC'], ['createdAt', 'DESC']]
    });
    res.status(200).json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules', message: error.message });
  }
};

// GET single module
exports.getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.status(200).json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module', message: error.message });
  }
};

// GET modules by semester
exports.getModulesBySemester = async (req, res) => {
  try {
    const { semester, year } = req.query;
    const where = {};
    if (semester) where.semester = semester;
    if (year) where.year = year;

    const modules = await Module.findAll({
      where,
      order: [['moduleCode', 'ASC']]
    });
    res.status(200).json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules', message: error.message });
  }
};

// CREATE new module
exports.createModule = async (req, res) => {
  try {
    console.log('\n=== CREATE MODULE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      moduleCode,
      moduleName,
      credits,
      semester,
      year,
      targetGrade,
      midExamWeight,
      numberOfQuizzes,
      quizWeights,
      numberOfAssignments,
      assignmentWeights,
      finalExamWeight,
      status
    } = req.body;

    const moduleCodeTrimmed = String(moduleCode ?? '').trim();
    const moduleNameTrimmed = String(moduleName ?? '').trim();
    if (!moduleCodeTrimmed || !moduleNameTrimmed) {
      return res.status(400).json({ error: 'Module code and name are required' });
    }

    // Check if module already exists
    console.log('Checking if module code exists:', moduleCodeTrimmed);
    const existingModule = await Module.findOne({ where: { moduleCode: moduleCodeTrimmed } });
    if (existingModule) {
      console.log('Module already exists:', existingModule.id);
      return res.status(400).json({ error: 'Module with this code already exists' });
    }

    // Validate weights sum to 100%
    console.log('Validating weights...');
    const nQuiz = Math.max(0, parseInt(numberOfQuizzes, 10) || 0);
    const nAssign = Math.max(0, parseInt(numberOfAssignments, 10) || 0);
    const quizArr = (Array.isArray(quizWeights) ? quizWeights : [])
      .slice(0, nQuiz)
      .map((w) => parseFloat(w) || 0);
    const assignArr = (Array.isArray(assignmentWeights) ? assignmentWeights : [])
      .slice(0, nAssign)
      .map((w) => parseFloat(w) || 0);

    const midWeight = midExamWeight !== undefined && midExamWeight !== null ? parseFloat(midExamWeight) : 20;
    const finalWeight = finalExamWeight !== undefined && finalExamWeight !== null ? parseFloat(finalExamWeight) : 40;
    const quizSum = quizArr.reduce((sum, w) => sum + w, 0);
    const assignmentSum = assignArr.reduce((sum, w) => sum + w, 0);
    const totalWeight = midWeight + quizSum + assignmentSum + finalWeight;
    
    console.log('Weight breakdown:', {
      midExamWeight: midWeight,
      quizWeightsSum: quizSum,
      assignmentWeightsSum: assignmentSum,
      finalExamWeight: finalWeight,
      total: totalWeight
    });

    if (Math.abs(totalWeight - 100) > 0.01) {
      console.log('Weight validation FAILED - sending error response');
      return res.status(400).json({ 
        error: 'Weight validation failed',
        message: `Weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`,
        breakdown: {
          midExamWeight: midWeight,
          quizWeightsSum: quizSum,
          assignmentWeightsSum: assignmentSum,
          finalExamWeight: finalWeight,
          total: totalWeight
        }
      });
    }
    console.log('Weight validation PASSED');

    const creditsVal = Math.max(1, parseInt(credits, 10) || 3);
    const semesterVal = parseInt(semester, 10);
    const yearVal = Math.max(1, parseInt(year, 10) || 1);
    const targetVal =
      targetGrade !== undefined && targetGrade !== null && targetGrade !== ''
        ? parseFloat(targetGrade)
        : 70;

    const createPayload = {
      moduleCode: moduleCodeTrimmed,
      moduleName: moduleNameTrimmed,
      credits: creditsVal,
      semester: semesterVal,
      year: yearVal,
      targetGrade: Number.isFinite(targetVal) ? targetVal : 70,
      midExamWeight: midWeight,
      numberOfQuizzes: nQuiz,
      quizWeights: quizArr,
      numberOfAssignments: nAssign,
      assignmentWeights: assignArr,
      finalExamWeight: finalWeight
    };
    if (status && ['active', 'completed', 'dropped'].includes(status)) {
      createPayload.status = status;
    }

    const module = await Module.create(createPayload);

    console.log('Module created successfully:', module.id);
    console.log('Module data:', JSON.stringify(module, null, 2));

    res.status(201).json({ 
      message: 'Module created successfully',
      module 
    });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Failed to create module', message: error.message });
  }
};

// UPDATE module
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const {
      moduleCode: nextCode,
      moduleName: nextName,
      credits,
      semester,
      year,
      targetGrade,
      midExamWeight,
      numberOfQuizzes,
      quizWeights,
      numberOfAssignments,
      assignmentWeights,
      finalExamWeight,
      status
    } = req.body;

    if (nextCode !== undefined && nextCode !== module.moduleCode) {
      const taken = await Module.findOne({ where: { moduleCode: nextCode } });
      if (taken && taken.id !== module.id) {
        return res.status(400).json({
          error: 'Module with this code already exists',
          message: 'Another module is already using this module code.'
        });
      }
    }

    const patch = {};
    if (nextCode !== undefined) patch.moduleCode = nextCode;
    if (nextName !== undefined) patch.moduleName = nextName;
    if (credits !== undefined) patch.credits = credits;
    if (semester !== undefined) patch.semester = semester;
    if (year !== undefined) patch.year = year;
    if (targetGrade !== undefined) patch.targetGrade = targetGrade;
    if (midExamWeight !== undefined) patch.midExamWeight = midExamWeight;
    if (numberOfQuizzes !== undefined) patch.numberOfQuizzes = numberOfQuizzes;
    if (quizWeights !== undefined) patch.quizWeights = quizWeights;
    if (numberOfAssignments !== undefined) patch.numberOfAssignments = numberOfAssignments;
    if (assignmentWeights !== undefined) patch.assignmentWeights = assignmentWeights;
    if (finalExamWeight !== undefined) patch.finalExamWeight = finalExamWeight;
    if (status !== undefined) patch.status = status;

    // Validate weights if they're being updated
    if (patch.midExamWeight !== undefined || patch.quizWeights !== undefined ||
        patch.assignmentWeights !== undefined || patch.finalExamWeight !== undefined) {

      const midWeight = patch.midExamWeight !== undefined ? parseFloat(patch.midExamWeight) : (module.midExamWeight || 20);
      const finalWeight = patch.finalExamWeight !== undefined ? parseFloat(patch.finalExamWeight) : (module.finalExamWeight || 40);
      const quizSum = (patch.quizWeights !== undefined ? patch.quizWeights : module.quizWeights || []).reduce((sum, w) => sum + parseFloat(w || 0), 0);
      const assignmentSum = (patch.assignmentWeights !== undefined ? patch.assignmentWeights : module.assignmentWeights || []).reduce((sum, w) => sum + parseFloat(w || 0), 0);
      const totalWeight = midWeight + quizSum + assignmentSum + finalWeight;

      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({
          error: 'Weight validation failed',
          message: `Weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`,
          breakdown: {
            midExamWeight: midWeight,
            quizWeightsSum: quizSum,
            assignmentWeightsSum: assignmentSum,
            finalExamWeight: finalWeight,
            total: totalWeight
          }
        });
      }
    }

    await module.update(patch);
    res.status(200).json({ 
      message: 'Module updated successfully',
      module 
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Failed to update module', message: error.message });
  }
};

// DELETE module
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    await module.destroy();
    res.status(200).json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module', message: error.message });
  }
};
