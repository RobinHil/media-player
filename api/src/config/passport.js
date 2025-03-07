// server/config/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';

import config from './config.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

export const setupPassport = (app) => {
  // Initialisation de Passport
  app.use(passport.initialize());
  
  // Configuration de la stratégie locale (email/mot de passe)
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Rechercher l'utilisateur par email
        const user = await User.findOne({ email }).select('+password');
        
        // Vérifier si l'utilisateur existe
        if (!user) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }
        
        // Vérifier si le compte est actif
        if (!user.active) {
          return done(null, false, { message: 'Compte désactivé, veuillez contacter l\'administrateur' });
        }
        
        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }
        
        // Supprimer le mot de passe de l'objet utilisateur
        const userObject = user.toObject();
        delete userObject.password;
        
        return done(null, userObject);
      } catch (error) {
        logger.error('Erreur lors de l\'authentification locale:', error);
        return done(error);
      }
    }
  ));
  
  // Configuration de la stratégie JWT
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      // Extraire le token du header Authorization
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Extraire le token des cookies
      (req) => {
        if (req && req.cookies) {
          return req.cookies['access_token'];
        }
        return null;
      }
    ]),
    secretOrKey: config.auth.jwtSecret,
    algorithms: ['HS256']
  };
  
  passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      // Vérifier si le token n'est pas expiré
      const now = Date.now() / 1000;
      if (now > jwtPayload.exp) {
        return done(null, false, { message: 'Token expiré' });
      }
      
      // Rechercher l'utilisateur par ID
      const user = await User.findById(jwtPayload.sub);
      
      if (!user) {
        return done(null, false, { message: 'Utilisateur introuvable' });
      }
      
      if (!user.active) {
        return done(null, false, { message: 'Compte désactivé' });
      }
      
      return done(null, user);
    } catch (error) {
      logger.error('Erreur lors de l\'authentification JWT:', error);
      return done(error);
    }
  }));
  
  // Configuration de la stratégie Google OAuth2
  if (config.auth.googleClientId && config.auth.googleClientSecret) {
    passport.use(new GoogleStrategy({
      clientID: config.auth.googleClientId,
      clientSecret: config.auth.googleClientSecret,
      callbackURL: config.auth.googleCallbackUrl,
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Rechercher l'utilisateur par son ID Google
        let user = await User.findOne({ 'google.id': profile.id });
        
        // Si l'utilisateur n'existe pas, vérifier s'il existe avec cet email
        if (!user && profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          user = await User.findOne({ email });
          
          if (user) {
            // L'utilisateur existe déjà, mettre à jour ses infos Google
            user.google = {
              id: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              token: accessToken
            };
            
            await user.save();
          }
        }
        
        // Si l'utilisateur n'existe toujours pas, le créer
        if (!user) {
          // Créer un nouvel utilisateur
          user = new User({
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
            name: profile.displayName,
            google: {
              id: profile.id,
              email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
              name: profile.displayName,
              token: accessToken
            },
            // Marquer le compte comme actif automatiquement
            active: true,
            // Donner un rôle de base
            role: 'user'
          });
          
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        logger.error('Erreur lors de l\'authentification Google:', error);
        return done(error);
      }
    }));
  }
  
  return passport;
};

export default passport;