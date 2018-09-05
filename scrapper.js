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
                        let relationDeclarations = [];
                        
                        $(tdsInrow[2]).find("ul>li>a").each(function(index,link){
                            relationDeclarations.push(
                                {"reportLink":$(link).prop("href"),
                                 "reportTitle":$(link).text()
                                }
                            )
                        })
                        
                        person.relatedPersonsList.push(
                        {
                            fName:fullName[0],
                            mName:fullName[1],
                            lName:fullName[2],
                            relationType:$(tdsInrow[1]).text(),
                            relationDeclarations:relationDeclarations
                        })
                    }
                    
                });

                next(person);
            }
        })
    }

    ,scrappDeclacation:function(url, next){

        let declaration = {
            docTitle:"",
            year:"",
            source:url,
            table2:[],  //ՀԱՅՏԱՐԱՐԱՏՈՒ ՊԱՇՏՈՆԱՏԱՐ ԱՆՁԻ ԳՈՒՅՔԸ
            table3:[],  //
            table4:[],
            table5:[],
            table6:[],
            table7:[]
        }
        request(url, function(error, response, html){
            if(!error){
                let $ = cheerio.load(html);
                declaration.docTitle=$(".ttl").first().text().toLocaleLowerCase();
                
                let tables = $(".tbl.mcol")
                                          
                //Second Data Table //ձեռքբերած և օտարած անշարժ գույքը
                let table2 = $(tables).eq(2).find("tr"); 
                table2.each(function(index,tr){
                    if(index>3){               //Avoide table's headers
                        declaration.table2.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                existsAtStart:formatYesNo(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                acquiredCurrency:remNl(extractFromTR($,tr,5)),
                                removedValue:formatMoney(extractFromTR($,tr,6)),
                                removedCurrency:remNl(extractFromTR($,tr,7)),
                                existsAtEnd:formatYesNo(extractFromTR($,tr,8)),
                            }
                        )
                    }
                    
                });

               
                //3th data table //շարժական գույքը
                let table3 = $(tables).eq(3).find("tr");
                table3.each(function(index,tr){
                    if(index>2){//Avoide table's headers
                        declaration.table3.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                serie:remNl(extractFromTR($,tr,2)),
                                existsAtStart:formatYesNo(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                acquiredCurrency:remNl(extractFromTR($,tr,5)),
                                removedValue:formatMoney(extractFromTR($,tr,6)),
                                removedCurrency:remNl(extractFromTR($,tr,7)),
                                existsAtEnd:formatYesNo(extractFromTR($,tr,8)),
                            }
                        )
                    }
                    
                });



                //4th data table //արժեթղթերը
                let table4 = $(tables).eq(4).find("tr");
                table4.each(function(index,tr){
                    if(index>2){//Avoide table's headers
                        declaration.table4.push(
                            {
                                nn:extractFromTR($,tr,0),
                                type:extractFromTR($,tr,1),
                                currency:extractFromTR($,tr,2),
                                startValue:formatMoney(extractFromTR($,tr,3)),
                                acquiredValue:formatMoney(extractFromTR($,tr,4)),
                                removedValue:formatMoney(extractFromTR($,tr,5)),
                                endValue:formatMoney(extractFromTR($,tr,6)),
                            }
                        )
                    }
                    
                });



                next(declaration);
            }
        })
    }


}


function extractFromTR($,tr,index){
    return $($(tr).find("td")[index]).text()
    
}


function formatMoney(amount){
    return amount.trim()
                  .split(",")
                  .join("")
}


function formatYesNo(data){
    return (data=="ԱՅՈ")? true:false
}

function remNl(data){
    return data.replace("\n", "");
}

    
