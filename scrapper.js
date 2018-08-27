const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrappPerson:function(url, next){
        let person = {
            fName:"",
            mName:"",
            lName:"",
            currentPositionTitle:"",
            currentPositionFrom:"",
            source:url,
            reportsList:[],
            relatedPersonsList:[]
        }
        request(url, function(error, response, html){
            if(!error){
                let $ = cheerio.load(html);
                let fullName = $(".pers-title .pers-fullname").first().text().split(" ");
                person.fName =  fullName[0];
                person.mName =  fullName[1];
                person.lName =  fullName[2];
                
                let m =  $(".pers-title").contents()
                    .filter(function() {
                        return this.nodeType === 3; //Node.TEXT_NODE
                });

                person.currentPositionTitle = $(".pers-title strong").first().text();
                person.currentPositionFrom =  m[3].data.split(" ")[0]; //TODO; Check index 3 for other pages 
                
                //Reports
                let reportsList = $("#content ul").first();
                let regexForYear = /\(([^)]+)\)/;
                reportsList.children().each(function(index, rep){
                    person.reportsList.push({
                        "reportLink":$(rep).find("a").prop("href"),
                        "reportTitle":$(rep).find("a").text(),
                        "reportPosition":$(rep).text().split("\n\t\t")[1],
                        "reportYear":regexForYear.exec($(rep).find("a").text())[1]
                    })
                })


                //Relation Declarations
                $("#relations-decl > tbody >tr").each(function(index, relatedPerson){
                    let tdsInrow = $(relatedPerson).find("td");
                    if(tdsInrow[0]){  //for first row eg. table headings
                        let fullName = $(tdsInrow[0]).text().split(" ");
                        person.relatedPersonsList.push(
                        {
                            fName:fullName[0],
                            mName:fullName[1],
                            lName:fullName[2],
                            relationType:$(tdsInrow[1]).text()
                        })
                        //console.log($(tdsInrow[2]).html());
                    }
                    
                });

                next(person);
            }
        })
    }
}




   
    

   

    
