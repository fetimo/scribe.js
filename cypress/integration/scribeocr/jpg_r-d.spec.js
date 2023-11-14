const httpServer = Cypress.env('TESTSITE');

describe('It recognises and downloads a', () => {
  beforeEach(() => {
    cy.visit(httpServer);
    
cy.wait(2000);
  })

  it('text file from a jpg with no imported ocr data', () => {
    cy.get('#openFileInput').selectFile(['cypress/fixtures/multi_jpg/aurelia.jpg'], { force: true })
    cy.wait(3000)
    cy.get('#pageCount').should('have.text', '1')
    
    
    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(10000)

    

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionText').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('aurelia.txt', {contains: true})
  })

  it('text file from 4 jpgs with no imported ocr data', () => {
    cy.get('#openFileInput').selectFile([
      'cypress/fixtures/multi_jpg/henreys_grave.jpg', 
      'cypress/fixtures/multi_jpg/aurelia.jpg',
      'cypress/fixtures/multi_jpg/the_past.jpg', 
      'cypress/fixtures/snow_drops.jpg'
    ], { force: true })
    cy.wait(10000)
    cy.get('#pageCount').should('have.text', '4')
    
    
    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(30000)

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionText').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('henreys_grave.txt', {contains: true})
  })

  it('pdf file from a jpg with no imported ocr data, NATIVE', () => {
    cy.get('#openFileInput').selectFile(['cypress/fixtures/multi_jpg/the_past.jpg'], { force: true })
    cy.wait(3000)
    cy.get('#pageCount').should('have.text', '1')
    
    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(10000)

    cy.get('#nav-view-tab').click()
cy.wait(500)
    cy.get('#colorMode').select('Native')

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionPDF').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('the_past', {contains: true})
  })

  it('pdf file from a jpg with no imported ocr data, BINARY', () => {
    cy.get('#openFileInput').selectFile(['cypress/fixtures/multi_jpg/the_past.jpg'], { force: true })
    cy.wait(3000)
    cy.get('#pageCount').should('have.text', '1')
    
    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(10000)

    cy.get('#nav-view-tab').click()
cy.wait(500)
    cy.get('#colorMode').select('Binary')

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionPDF').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('the_past', {contains: true})
  })

  it('pdf file from 4 jpgs with no imported ocr data', () => {
    cy.get('#openFileInput').selectFile([
      'cypress/fixtures/multi_jpg/aurelia.jpg', 
      'cypress/fixtures/multi_jpg/henreys_grave.jpg',
      'cypress/fixtures/multi_jpg/the_past.jpg', 
      'cypress/fixtures/snow_drops.jpg'
    ], { force: true })
    cy.wait(10000)
    cy.get('#pageCount').should('have.text', '4')

    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(30000)


    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionPDF').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('aurelia.pdf', {contains: true})
  })

  it('hocr file from a jpg with no imported ocr data', () => {
    cy.get('#openFileInput').selectFile(['cypress/fixtures/snow_drops.jpg'], { force: true })
    cy.wait(3000)
    cy.get('#pageCount').should('have.text', '1')

    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(15000)

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionHOCR').click()
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('snow_drops.hocr', {contains: true})
  })

  it('hocr file from 4 jpgs with no imported ocr data', () => {
    cy.get('#openFileInput').selectFile([
      'cypress/fixtures/multi_jpg/the_past.jpg', 
      'cypress/fixtures/multi_jpg/henreys_grave.jpg',
      'cypress/fixtures/multi_jpg/aurelia.jpg', 
      'cypress/fixtures/snow_drops.jpg',
    ], { force: true })
    cy.wait(10000)
    cy.get('#pageCount').should('have.text', '4')

    cy.get('#nav-recognize-tab').click()
cy.wait(500)
    cy.get('#recognizeAll').click()
    cy.wait(30000)

    cy.get('#nav-download-tab').click()
cy.wait(500)
    cy.get('#downloadFormat').click()
    cy.get('#formatLabelOptionHOCR').click()  
    cy.wait(500)
cy.get('#download').click()
    cy.verifyDownload('the_past.hocr', {contains: true})
  })

})