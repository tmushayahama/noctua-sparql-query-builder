import {
    Graph,
    Optional,
    optional,
    Prefix,
    prefix,
    Triple,
    Query,
    triple,

} from "sparql-query-builder/dist";

let buildAllCuratorsQuery = () => {
    let query = new Query();

    query.prefix(
        prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
        prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
        prefix('metago', '<http://model.geneontology.org/>'),
        prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'))
        .select(
            '?orcid ?name',
            '(GROUP_CONCAT(distinct ?organization;separator="@@") AS ?organizations)',
            '(GROUP_CONCAT(distinct ?affiliation;separator="@@") AS ?affiliations)',
            '(COUNT(distinct ?cam) AS ?cams)'
        )
        .where(
            triple('?cam', 'metago:graphType', 'metago:noctuaCam'),
            triple('?cam', 'dc:contributor', '?orcid'),
            'BIND( IRI(?orcid) AS ?orcidIRI)',
            optional(triple('?orcidIRI', 'rdfs:label', '?name'),
                triple('?orcidIRI', '<http://www.w3.org/2006/vcard/ns#organization-name>', '?organization'),
                triple('?orcidIRI', 'has_affiliation:', '?affiliation'),
            ),
            'BIND(IF(bound(?name), ?name, ?orcid) as ?name)')
        .groupBy('?orcid ?name')
        .orderBy('?name', 'ASC');

    return query.build();
}


let buildCamsByGoTermQuery = (goTermId: string) => {
    let query = new Query();
    let graphQuery = new Query();

    graphQuery.graph('?model',
        '?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; dc:contributor ?contributor',
        optional('?model providedBy: ?providedBy'),
        triple('?entity ', 'rdf:type', 'owl:NamedIndividual'),
        triple('?entity', 'rdf:type', '?term'),
        `FILTER(?term = ${goTermId})`);

    query.prefix(prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
        prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
        prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
        prefix('metago', '<http://model.geneontology.org/>'),
        prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
        prefix('GO', '<http://purl.obolibrary.org/obo/GO_>'),
        prefix('BP', '<http://purl.obolibrary.org/obo/GO_0008150>'),
        prefix('MF', '<http://purl.obolibrary.org/obo/GO_0003674>'),
        prefix('CC', '<http://purl.obolibrary.org/obo/GO_0005575>'),
        prefix('providedBy', '<http://purl.org/pav/providedBy>'))
        //prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'))
        .select(
            'distinct ?model ?modelTitle ?aspect ?term ?termLabel ?date',
            '(GROUP_CONCAT(distinct ?entity;separator="@@") as ?entities)',
            '(GROUP_CONCAT(distinct ?contributor;separator="@@") as ?contributors)',
            '(GROUP_CONCAT(distinct ?providedBy;separator="@@") as ?groups)'
        )
        .where(graphQuery,
            'VALUES ?aspect { BP: MF: CC: }',
            triple('?entity', 'rdf:type', '?aspect'),
            triple('?term', 'rdfs:label', '?termLabel'))
        .groupBy('?model ?modelTitle ?aspect ?term ?termLabel ?date')
        .orderBy('?date', 'DESC');

    return query.build();
}



let buildCamsByCuratorQuery = (goTermId: string, orcid: any) => {

    let query = new Query();
    let graphQuery = new Query();
    graphQuery.graph('?model',
        '?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; dc:contributor ?orcid',
        optional('?model providedBy: ?providedBy'),
        triple('?entity ', 'rdf:type', 'owl:NamedIndividual'),
        triple('?entity', 'rdf:type', '?term'),
        `FILTER(?term = ${goTermId})`
    );

    query.prefix(
        prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
        prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
        prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
        prefix('metago', '<http://model.geneontology.org/>'),
        prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
        prefix('GO', '<http://purl.obolibrary.org/obo/GO_>'),
        prefix('BP', '<http://purl.obolibrary.org/obo/GO_0008150>'),
        prefix('MF', '<http://purl.obolibrary.org/obo/GO_0003674>'),
        prefix('CC', '<http://purl.obolibrary.org/obo/GO_0005575>'),
        prefix('providedBy', '<http://purl.org/pav/providedBy>'),
        prefix('vcard', '<http://www.w3.org/2006/vcard/ns#>'),
        prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'),
        prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
        prefix('obo', '<http://www.geneontology.org/formats/oboInOwl#>'))
        .select(
            'distinct ?model ?modelTitle ?aspect ?term ?termLabel ?date',
            '(GROUP_CONCAT(distinct ?entity;separator="@@") as ?entities)',
            '(GROUP_CONCAT(distinct ?orcid;separator="@@") as ?contributors)',
            '(GROUP_CONCAT(distinct ?providedBy;separator="@@") as ?groups)'
        ).where(
            `BIND(${orcid} as ?orcid)`,
            'BIND(IRI(?orcid) as ?orcidIRI)',
            graphQuery,
            'VALUES ?aspect { BP: MF: CC: }',
            triple('?entity', 'rdf:type', '?aspect'),
            triple('?term', 'rdfs:label', '?termLabel'),
            optional(
                triple('?orcidIRI', 'rdfs:label', '?name')
            ),
            'BIND(IF(bound(?name), ?name, ?orcid) as ?name)',

        )
        .groupBy('?model ?modelTitle ?aspect ?term ?termLabel ?date')
        .orderBy('?date', 'DESC');
    return query.build();
}


let buildCamsByCuratorQueryAdvanced = (orcid: any) => {
    //  let modOrcid = this.getOrcid(orcid);
    let query = new Query();
    let graphQuery = new Query();
    graphQuery.graph('?model',
        '?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; dc:contributor ?orcid',
        triple('?entity', 'rdf:type', 'owl:NamedIndividual'),
        triple('?entity', 'rdf:type', '?goid'),
        triple('?s', ' enabled_by:', '?gpentity'),
        triple('?gpentity', 'rdf:type', '?gpid '),
        'FILTER(?gpid != owl:NamedIndividual)');

    query.prefix(
        prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
        prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
        prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
        prefix('metago', '<http://model.geneontology.org/>'),
        prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
        prefix('GO', '<http://purl.obolibrary.org/obo/GO_>'),
        prefix('BP', '<http://purl.obolibrary.org/obo/GO_0008150>'),
        prefix('MF', '<http://purl.obolibrary.org/obo/GO_0003674>'),
        prefix('CC', '<http://purl.obolibrary.org/obo/GO_0005575>'),
        prefix('providedBy', '<http://purl.org/pav/providedBy>'),
        prefix('vcard', '<http://www.w3.org/2006/vcard/ns#>'),
        prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'),
        prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
        prefix('obo', '<http://www.geneontology.org/formats/oboInOwl#>')
    ).select('?model ?modelTitle',
        '(GROUP_CONCAT(distinct ?spec;separator="@@") as ?species)',
        '(GROUP_CONCAT(distinct ?goid;separator="@@") as ?bpids)',
        '(GROUP_CONCAT(distinct ?goname;separator="@@") as ?bpnames)',
        '(GROUP_CONCAT(distinct ?gpid;separator="@@") as ?gpids)',
        '(GROUP_CONCAT(distinct ?gpname;separator="@@") as ?gpnames)'
    ).where(
        `BIND(${orcid} as ?orcid)`,
        'BIND(IRI(?orcid) as ?orcidIRI)',
        graphQuery,
        'VALUES ?aspect { BP: }',
        triple('?entity', 'rdf:type', '?aspect'),
        'filter(?goid != MF: )',
        'filter(?goid != BP: )',
        'filter(?goid != CC: )',
        triple('?goid', 'rdfs:label', '?goname'),
        optional(
            triple('?orcidIRI', 'rdfs:label', '?name')
        ),
        'BIND(IF(bound(?name), ?name, ?orcid) as ?name)',
        optional(
            triple('?orcidIRI', 'vcard:organization-name', '?organization'),
            triple('?orcidIRI', 'has_affiliation:', '?affiliationIRI '),
            triple('?affiliationIRI', 'rdfs:label', '?affiliation'),
            triple('?gpid', 'rdfs:label', '?gpname'),
            triple('?gpid', 'rdfs:subClassOf ?v0'),
            triple('?v0', 'owl:onProperty', '<http://purl.obolibrary.org/obo/RO_0002162>'),
            triple('?v0', 'owl:someValuesFrom', '?taxon'),
            triple('?taxon', 'rdfs:label', '?spec')
        )
    )
        .groupBy('?model ?modelTitle')
        .orderBy('?date', 'DESC');



    let query2 = `
      PREFIX metago: <http://model.geneontology.org/>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
      PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
      PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
      PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
      PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX BP: <http://purl.obolibrary.org/obo/GO_0008150>
      PREFIX MF: <http://purl.obolibrary.org/obo/GO_0003674>
      PREFIX CC: <http://purl.obolibrary.org/obo/GO_0005575>
          
      SELECT  ?model ?modelTitle	(GROUP_CONCAT(distinct ?spec;separator="@@") as ?species)
                (GROUP_CONCAT(distinct ?goid;separator="@@") as ?bpids)
                (GROUP_CONCAT(distinct ?goname;separator="@@") as ?bpnames)
                (GROUP_CONCAT(distinct ?gpid;separator="@@") as ?gpids)
                (GROUP_CONCAT(distinct ?gpname;separator="@@") as ?gpnames)
      WHERE 
      {            
          BIND(` + orcid + ` as ?orcid) .
          BIND(IRI(?orcid) as ?orcidIRI) .
                    
          # Getting some information on the model
          GRAPH ?model 
          {
              ?model metago:graphType metago:noctuaCam ;
                      dc:date ?date ;
                      dc:title ?modelTitle ;
                      dc:contributor ?orcid .
              
             ?entity rdf:type owl:NamedIndividual .
             ?entity rdf:type ?goid .
  
              ?s enabled_by: ?gpentity .    
              ?gpentity rdf:type ?gpid .
              FILTER(?gpid != owl:NamedIndividual) .
         }
            
          VALUES ?aspect { BP: } . 
          # rdf:type faster then subClassOf+ but require filter 			
          # ?goid rdfs:subClassOf+ ?aspect .
      ?entity rdf:type ?aspect .
      
      # Filtering out the root BP, MF & CC terms
      filter(?goid != MF: )
      filter(?goid != BP: )
      filter(?goid != CC: )
      ?goid rdfs:label ?goname .
            
          # Getting some information on the contributor
          optional { ?orcidIRI rdfs:label ?name } .
          BIND(IF(bound(?name), ?name, ?orcid) as ?name) .
          optional { ?orcidIRI vcard:organization-name ?organization } .
          optional { 
              ?orcidIRI has_affiliation: ?affiliationIRI .
              ?affiliationIRI rdfs:label ?affiliation
          } .
            
        
          # Require each GP to have a correct URI, not the case for SYNGO at this time
          optional {
          ?gpid rdfs:label ?gpname .
          ?gpid rdfs:subClassOf ?v0 . 
          ?v0 owl:onProperty <http://purl.obolibrary.org/obo/RO_0002162> . 
          ?v0 owl:someValuesFrom ?taxon .
                
          ?taxon rdfs:label ?spec .  
          }
            
      }
      GROUP BY ?model ?modelTitle
      ORDER BY DESC(?date)
      `
    return query.build();
}

console.log(buildCamsByGoTermQuery('GO:0017127'),
    '\n\n\n\n\n',
    buildAllCuratorsQuery(),
    '\n\n\n\n',
    buildCamsByCuratorQuery('GO:0017127', '"http://orcid.org/0000-0002-2874-6934"^^xsd:string'))
