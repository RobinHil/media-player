// server/controllers/admin.controller.js
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import ActivityLog from '../models/activityLog.model.js';
import Setting from '../models/setting.model.js';
import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Récupérer les journaux d'activité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const userId = req.query.userId;
    
    // Construire le filtre
    const filter = {};
    
    if (type) {
      filter.action = type;
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    // Récupérer les journaux avec pagination
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
    
    // Compter le nombre total de journaux
    const total = await ActivityLog.countDocuments(filter);
    
    // Calculer le nombre total de pages
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des journaux d\'activité:', error);
    next(error);
  }
};

/**
 * Récupérer les statistiques globales
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getStats = async (req, res, next) => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    
    // Nouveaux utilisateurs (derniers 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Statistiques de stockage
    let totalSpace = 0;
    let usedSpace = 0;
    let totalFiles = 0;
    
    try {
      // Calculer l'espace utilisé (peut être coûteux pour de grands systèmes de fichiers)
      const { totalSize, fileCount } = await calculateStorageUsage(config.media.baseDir);
      usedSpace = totalSize;
      totalFiles = fileCount;
      
      // Pour l'espace total, utiliser la capacité du disque ou une valeur par défaut
      totalSpace = 1024 * 1024 * 1024 * 1024; // 1TB par défaut
    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques de stockage:', error);
    }
    
    // Statistiques d'activité (derniers 7 jours)
    const logins = await ActivityLog.countDocuments({
      action: 'login',
      timestamp: { $gte: sevenDaysAgo }
    });
    
    const uploads = await ActivityLog.countDocuments({
      action: 'upload_file',
      timestamp: { $gte: sevenDaysAgo }
    });
    
    const views = await ActivityLog.countDocuments({
      action: { $in: ['stream_media', 'view_file'] },
      timestamp: { $gte: sevenDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers
      },
      storage: {
        total: totalSpace,
        used: usedSpace,
        files: totalFiles
      },
      activity: {
        logins,
        uploads,
        views
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    next(error);
  }
};

/**
 * Récupérer les paramètres globaux
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSettings = async (req, res, next) => {
  try {
    // Récupérer les paramètres
    let settings = await Setting.findOne();
    
    // Si aucun paramètre n'existe, créer les paramètres par défaut
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des paramètres:', error);
    next(error);
  }
};

/**
 * Mettre à jour les paramètres globaux
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { registration, storage, security } = req.body;
    
    // Récupérer les paramètres existants
    let settings = await Setting.findOne();
    
    // Si aucun paramètre n'existe, créer les paramètres par défaut
    if (!settings) {
      settings = new Setting();
    }
    
    // Mettre à jour les paramètres
    if (registration) {
      settings.registration = {
        ...settings.registration,
        ...registration
      };
    }
    
    if (storage) {
      settings.storage = {
        ...settings.storage,
        ...storage
      };
    }
    
    if (security) {
      settings.security = {
        ...settings.security,
        ...security
      };
    }
    
    // Sauvegarder les paramètres
    await settings.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'admin_update_settings',
      userId: req.user._id,
      details: {
        registration,
        storage,
        security
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Paramètres mis à jour',
      settings
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des paramètres:', error);
    next(error);
  }
};

/**
 * Calculer l'utilisation de stockage d'un dossier de manière récursive
 * @param {string} dir - Chemin du dossier à analyser
 * @returns {Object} Informations sur l'utilisation de stockage
 */
const calculateStorageUsage = async (dir) => {
  let totalSize = 0;
  let fileCount = 0;
  
  // Fonction récursive pour parcourir les dossiers
  const processDirectory = async (currentDir) => {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        // Récursion pour les sous-dossiers
        await processDirectory(itemPath);
      } else if (item.isFile()) {
        // Ajouter la taille du fichier
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
        fileCount++;
      }
    }
  };
  
  // Lancer le calcul
  await processDirectory(dir);
  
  return { totalSize, fileCount };
};

/**
 * Créer une entrée dans le journal d'activité
 * @param {Object} data - Données de l'activité
 * @returns {Promise} Promise résolue avec l'entrée créée
 */
const createActivityLog = async (data) => {
  try {
    // Créer une nouvelle entrée
    const log = new ActivityLog(data);
    
    // Sauvegarder l'entrée
    await log.save();
    
    return log;
  } catch (error) {
    logger.error('Erreur lors de la création d\'une entrée dans le journal d\'activité:', error);
    return null;
  }
};

export default {
  getLogs,
  getStats,
  getSettings,
  updateSettings
};