const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrappPerson:function(url){
        let person = {
            fName:"",
            mName:"",
            lName:"",
            source:url
        }
        request(url, function(error, response, html){
            if(!error){
                let $ = cheerio.load(html);
                let fullName = $(".pers-title .pers-fullname").first().text().split(" ");
                person.fName =  fullName[0];
                person.mName =  fullName[1];
                person.lName =  fullName[2];
                person.currentPositionTitle = $(".pers-title strong").first().text();

                let m =  $(".pers-title").contents()
                    .filter(function() {
                        return this.nodeType === 3; //Node.TEXT_NODE
                });

                person.currentPositionFrom =  m[3].data.split(" ")[0]; //TODO; Check index 3 for other pages 

                //Reports
                let reportsList = $("#content ul").first();
                reportsList.children().each(function(index, rep){
                    console.log($(rep).find("a").prop("href"));
                    console.log($(rep).find("a").text());
                    console.log($(rep))
                })

                
                console.log(person);
            }
        })
    }
}




   
    

   

    
