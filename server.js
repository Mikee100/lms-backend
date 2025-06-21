const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config();

const tutorRoutes = require('./routes/tutorRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes'); 
const coursesRoute = require('./routes/coursesRoutes');
const schedulesRoute = require('./routes/schedulesRoute');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const noticationsRoute = require('./routes/notificationsRoute');
const messageRoutes = require('./routes/messageRoutes');
const progressRoutes = require('./routes/progressRoutes');
const activityRoutes = require('./routes/activityRoutes');
const studentProfileRoutes = require('./routes/studentProfileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const socialLearningRoutes = require('./routes/socialLearningRoutes');
const Assignment = require('./models/Assignment');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost',
  'https://lms-frontend-sepia-psi.vercel.app', // Add your Vercel frontend
  'http://localhost:5000' // (optional, if you want to allow backend to call itself)
];

const corsOptions = {
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// This line is critical:
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedule', schedulesRoute);
app.use('/api/enroll/students', enrollmentRoutes);
app.use('/api/notifications', noticationsRoute)
app.use('/api/messages',messageRoutes)

app.use('/api/progress', progressRoutes);

app.use('/api/activity', activityRoutes);

//courses route

app.use('/api/courses', coursesRoute);

app.use('/api/students', studentProfileRoutes);

app.use('/api/payments', paymentRoutes);

// Gamification routes
app.use('/api/gamification', gamificationRoutes);

// Recommendation routes
app.use('/api/recommendations', recommendationRoutes);

// Social Learning routes
app.use('/api/social', socialLearningRoutes);

// Express route (backend)

app.post('/api/assignments/generate', async (req, res) => {
  const { materialFilename } = req.body;
  const pdfPath = path.resolve(__dirname, 'uploads', materialFilename);

  const py = spawn('python', [
  path.join(__dirname, 'Assignment.py'),
  pdfPath // now absolute
]);

  let output = '';
  py.stdout.on('data', (data) => { output += data.toString(); });
  py.stderr.on('data', (data) => { 
  console.error('PYTHON STDERR:', data.toString()); 
});
py.stdout.on('data', (data) => { 
  console.log('PYTHON STDOUT:', data.toString());
  output += data.toString(); 
});
py.on('close', async (code) => {
  if (code !== 0) {
    console.error('Python script exited with code', code);
    return res.status(500).json({ message: 'Python script failed' });
  }

  // Parse questions from output (split by lines, skip header)
  const questions = output
    .split('\n')
    .filter(line => /^\d+\./.test(line))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  // Save to DB
  const assignment = await Assignment.create({
  courseId: req.body.courseId,
  sectionId: req.body.sectionId,
  lectureId: req.body.lectureId, // ✅ added this
  materialFilename: req.body.materialFilename,
  questions
});


  res.json({ assignment });
});
});
app.get('/api/assignments', async (req, res) => {
  const { courseId, sectionId } = req.query;
  const query = {};
  if (courseId) query.courseId = courseId;
  if (sectionId) query.sectionId = sectionId;
  const assignments = await Assignment.find(query).sort({ createdAt: -1 });
  res.json(assignments);
});


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));






