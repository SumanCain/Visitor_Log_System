const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Parser } = require('json2csv');
const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');


// Middleware to check admin session
function isAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/login');
}

// Show form to log a new visitor
router.get('/', isAdmin, (req, res) => {
  res.render('index');
});

// Handle form submission
router.post('/add-visitor', isAdmin, async (req, res) => {
  try {
    const { name, purpose } = req.body;
    const newVisitor = new Visitor({ name, purpose });
    await newVisitor.save();
    res.redirect('/visitors');
  } catch (err) {
    res.send('Error saving visitor ❌');
  }
});

// Display all visitors with search
router.get('/visitors', isAdmin, async (req, res) => {
    try {
      const { search = '', startDate = '', endDate = '', page = 1 } = req.query;
      const perPage = 5;
      const query = {};
  
      if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
      }
  
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59'),
        };
      }
  
      const totalVisitors = await Visitor.countDocuments(query);
      const visitors = await Visitor.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);
  
      res.render('visitors', {
        visitors,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalVisitors / perPage),
        search,
        startDate,
        endDate,
      });
    } catch (err) {
      res.send('Error fetching visitors ❌');
    }
  });
  
  
  
  
  

// Show edit form
router.get('/edit-visitor/:id', isAdmin, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    res.render('edit', { visitor });
  } catch (err) {
    res.send('Error loading edit form ❌');
  }
});

// Handle edit form submission
router.post('/update-visitor/:id', isAdmin, async (req, res) => {
  try {
    const { name, purpose } = req.body;
    await Visitor.findByIdAndUpdate(req.params.id, { name, purpose });
    res.redirect('/visitors');
  } catch (err) {
    res.send('Error updating visitor ❌');
  }
});

// Handle delete
router.post('/delete-visitor/:id', isAdmin, async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.redirect('/visitors');
  } catch (err) {
    res.send('Error deleting visitor ❌');
  }
});
// GET: Show edit form
router.get('/edit-visitor/:id', isAdmin, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    res.render('edit', { visitor });
  } catch (err) {
    res.send('Error loading edit form ❌');
  }
});

// POST: Update visitor
router.post('/update-visitor/:id', isAdmin, async (req, res) => {
  try {
    const { name, purpose } = req.body;
    await Visitor.findByIdAndUpdate(req.params.id, { name, purpose });
    res.redirect('/visitors');
  } catch (err) {
    res.send('Error updating visitor ❌');
  }
});

router.get('/download/csv', isAdmin, async (req, res) => {
    try {
      const visitors = await Visitor.find().lean();
      const fields = ['name', 'purpose', 'date'];
      const parser = new Parser({ fields });
      const csv = parser.parse(visitors);
  
      res.header('Content-Type', 'text/csv');
      res.attachment('visitors.csv');
      res.send(csv);
    } catch (err) {
      res.status(500).send('Error generating CSV ❌');
    }
  });
  
// Download PDF
router.get('/download/pdf', isAdmin, async (req, res) => {
    try {
      const visitors = await Visitor.find().sort({ date: -1 });
  
      const doc = new PDFDocument();
      const filename = 'visitors.pdf';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
  
      doc.fontSize(20).text('Visitor Log Report', { align: 'center' });
      doc.moveDown();
  
      visitors.forEach(visitor => {
        doc
          .fontSize(12)
          .text(`Name: ${visitor.name}`)
          .text(`Purpose: ${visitor.purpose}`)
          .text(`Date: ${visitor.date.toLocaleString()}`)
          .moveDown();
      });
  
      doc.end();
    } catch (err) {
      res.status(500).send('Error generating PDF');
    }
  });
  

module.exports = router;
