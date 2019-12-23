(function (window) {
	window.extractData = function () {
		var ret = $.Deferred();

		function onError() {
			console.log('Loading error', arguments);
			ret.reject();
		}

		function onReady(smart) {
			var context = mapSmartContext(smart);
			
			var patient = smart.patient;
			var patientRead = patient.read();

			var practitioner = {};
			practitioner.type = "Practitioner";
			practitioner.id = smart.tokenResponse.user; // "605926"

			var practitionerRead = smart.api.read(practitioner);

			$.when(patientRead, practitionerRead).fail(onError);
			$.when(patientRead, practitionerRead).done(function (patient, practitioner) {

				context.patient = mapPatientContext(patient);

				context.practitioner = mapPractitionerContext(practitioner);

				ret.resolve(context);
			});
		}

		FHIR.oauth2.ready(onReady, onError);

		return ret.promise();
	};

	function defaultPatient() {
		return {
			id: {
				value: ''
			},
			mrn: {
				value: ''
			},
		};
	}

	window.postSensedContext = function (url, context) {

		var postData = {};
		postData = context;
		
		console.log('holon context: ' + JSON.stringify(postData));

		return $.ajax({
			'url': url,
			'type': 'POST',
			'dataType': 'json',
			'headers': {'Content-Type': 'application/json'},
			'data': JSON.stringify(postData)
		})
	};
	
	window.mapSmartContext = function (smart) {
		console.log('smart: ' + JSON.stringify(smart));

		var context = {"smart": {}};
		context.smart.tenantId = smart.tokenResponse.tenant;
		context.smart.patientId = smart.tokenResponse.patient;
		context.smart.userId = smart.tokenResponse.user;
		context.patient = {};
		context.practitioner = {};
		
		return context;
	};
	
	window.mapPatientContext = function (patient) {
		console.log('patient: ' + JSON.stringify(patient));
		
		var contextPatient = defaultPatient();
		contextPatient.id = patient.id;
		contextPatient.mrn = patient.id;
		contextPatient.text = patient.text.div;
		var identifiers = patient.identifier;

		if (identifiers !== undefined) {
			for (var j = 0; j < identifiers.length; j++) {
				if (identifiers[j].type.coding !== undefined
					 && identifiers[j].type.coding.length > 0
					 && identifiers[j].type.coding[0].code == "MR"
					 && identifiers[j].type.text.search(/^MRN$/i) !== -1) {
					contextPatient.mrn = identifiers[j].value;
				}
			}
		}
		
		return contextPatient;
	};
	
	window.mapPractitionerContext = function (practitioner) {
		console.log('practitioner: ' + JSON.stringify(practitioner));
		
		var contextPractitioner = practitioner.data;
		contextPractitioner.id = practitioner.data.id;
		contextPractitioner.npi = practitioner.data.id;
		contextPractitioner.text = practitioner.data.text.div;
		
		var identifiers = practitioner.data.identifier;

		if (identifiers !== undefined) {
			for (var i = 0; i < identifiers.length; i++) {
				if (identifiers[i].type.coding !== undefined
					 && identifiers[i].type.coding.length > 0
					 && identifiers[i].type.coding[0].code == "PRN"
					 && identifiers[i].type.text.search(/^National Provider Identifier$/i) !== -1) {
					contextPractitioner.npi = identifiers[i].value;
				}
			}
		}
		
		return contextPractitioner;
	};
	
	window.drawVisualization = function (context) {

		$('#holder').show();

		$('#smartTenantId').html(context.smart.tenantId);
        $('#smartPatientId').html(context.smart.patientId);
		$('#smartUserId').html(context.smart.userId);

		$('#patientId').html(context.patient.id);
		$('#mrn').html(context.patient.mrn);
		$('#patientText').html(context.patient.text);
		$('#practitionerId').html(context.practitioner.id);
		$('#npi').html(context.practitioner.npi);
		$('#practitionerText').html(context.practitioner.text);
	};
	
	window.getSmartContextMock = function () {
		return {
		     "server": {
		          "serviceUrl": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "auth": {
		               "type": "bearer",
		               "token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ"
		          }
		     },
		     "api": {},
		     "patient": {
		          "id": "4342008",
		          "api": {}
		     },
		     "userId": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Practitioner/4464007",
		     "user": {},
		     "state": {
		          "client": {
		               "client_id": "47c085b8-75a8-4ab8-ada4-c3bfcfee1efb",
		               "scope": "patient/Patient.read patient/Observation.read user/Practitioner.read launch online_access openid profile",
		               "redirect_uri": "https://sklements.github.io/smart-on-fhir-tutorial/example-smart-app/",
		               "launch": "f23107b2-1440-4d12-9f2f-dc56f0d8e7a7"
		          },
		          "response_type": "code",
		          "server": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "provider": {
		               "name": "SMART on FHIR Testing Server",
		               "description": "Dev server for SMART on FHIR",
		               "url": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		               "oauth2": {
		                    "registration_uri": null,
		                    "authorize_uri": "https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/personas/provider/authorize",
		                    "token_uri": "https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/token"
		               }
		          }
		     },
		     "tokenResponse": {
		          "need_patient_banner": true,
		          "id_token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5NS5yc2EiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJwb3J0YWwiLCJhdWQiOiI0N2MwODViOC03NWE4LTRhYjgtYWRhNC1jM2JmY2ZlZTFlZmIiLCJwcm9maWxlIjoiaHR0cHM6XC9cL2ZoaXItZWhyLnNhbmRib3hjZXJuZXIuY29tXC9kc3R1MlwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9QcmFjdGl0aW9uZXJcLzQ0NjQwMDciLCJpc3MiOiJodHRwczpcL1wvYXV0aG9yaXphdGlvbi5zYW5kYm94Y2VybmVyLmNvbVwvdGVuYW50c1wvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9vaWRjXC9pZHNwc1wvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC8iLCJuYW1lIjoiUG9ydGFsLCBQb3J0YWwiLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywiZmhpclVzZXIiOiJodHRwczpcL1wvZmhpci1laHIuc2FuZGJveGNlcm5lci5jb21cL2RzdHUyXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL1ByYWN0aXRpb25lclwvNDQ2NDAwNyJ9.Myd2rjkVgwHNoTRh4qVlG672-xjJHWtqRNIXupNmWitbvCSVJ6IgazmdXJMr9x_5fr-fYxomB6Pl4q399brgQ4-8ifVqSmzPpTt-oX1y6tHRZKCRgHUYn-AsAR7k5gH-3xOf_H6ip3SvD37moUfJNeCw1WYBH1lf5QIfxv7PMvVeO5-LE8IcG7xlpE0yI-fm0P8T_8y4N5vBftLDN1Q_WyJywzRVUWfC5MTqFPZI7WmFYy99bavxLAAnK-oqVbsnQ1rdYYz1VnBXFmGpHv3RCpWGw00F27k1yA6injp4S4Kp6FZkzoRQsTxMo_qIQvE7lvaKp_UMMf3DaB_ey0vamw",
		          "smart_style_url": "https://smart.sandboxcerner.com/styles/smart-v1.json",
		          "encounter": "4027906",
		          "token_type": "Bearer",
		          "access_token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ",
		          "refresh_token": "eyJpZCI6IjJjZGNiZjk5LWJhNzAtNDEyYS05MzgwLWRiNDYxZTYzZGE3NCIsInNlY3JldCI6IjRkNWFjZjkwLWU3ZGEtNDM0MC1iNzQ5LTExYTUzMmZjM2QwMiIsInZlciI6IjEuMCIsInR5cGUiOiJvbmxpbmVfYWNjZXNzIiwicHJvZmlsZSI6InNtYXJ0LXYxIn0=",
		          "patient": "4342008",
		          "scope": "patient/Patient.read patient/Observation.read user/Practitioner.read launch online_access openid profile",
		          "expires_in": 570,
		          "user": "4464007",
		          "tenant": "0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "username": "portal",
		          "code": "45b1405d-8013-492a-99a3-e598099ae842",
		          "state": "2e5ae7bc-b364-2bf2-f588-c2d35e76cab8"
		     }
		};
	}
	
	window.getPatientMock = function () {
		return {
		     "resourceType": "Patient",
		     "id": "4342008",
		     "meta": {
		          "versionId": "241",
		          "lastUpdated": "2019-12-05T04:25:33.000Z"
		     },
		     "text": {
		          "status": "generated",
		          "div": "<div><p><b>Patient</b></p><p><b>Name</b>: SMART, WILMA</p><p><b>DOB</b>: Mar 13, 1950</p><p><b>Administrative Gender</b>: Female</p><p><b>Marital Status</b>: Divorced</p><p><b>Status</b>: Active</p></div>"
		     },
		     "extension": [{
		               "url": "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity",
		               "extension": [{
		                         "url": "ombCategory",
		                         "valueCoding": {
		                              "system": "http://hl7.org/fhir/v3/Ethnicity",
		                              "code": "2135-2",
		                              "display": "Hispanic or Latino",
		                              "userSelected": false
		                         }
		                    }, {
		                         "url": "detailed",
		                         "valueCoding": {
		                              "system": "http://hl7.org/fhir/v3/Ethnicity",
		                              "code": "2135-2",
		                              "userSelected": false
		                         }
		                    }, {
		                         "url": "text",
		                         "valueString": "Hispanic or Latino"
		                    }
		               ]
		          }
		     ],
		     "identifier": [{
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "MR",
		                              "display": "Medical record number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Community Medical Record Number"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.787.0.0",
		               "value": "2453651",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "2453651"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2019-08-07T22:12:36.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "MR",
		                              "display": "Medical record number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "MRN"
		               },
		               "system": "urn:oid:2.2.2.2.2.2",
		               "value": "10000891",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "10000891"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2018-09-19T15:58:40.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "MR",
		                              "display": "Medical record number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "MRN"
		               },
		               "system": "urn:oid:1.1.1.1.1.1",
		               "value": "10002700",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "10002700"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2016-06-22T20:25:56.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "text": "Military Id"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.42.10001.100001.12",
		               "value": "565848",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "565848"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2019-09-18T20:45:32.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "U",
		                              "display": "Unspecified identifier",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Messaging"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.8",
		               "value": "00000001236790",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "00000001236790"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "U",
		                              "display": "Unspecified identifier",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Messaging"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.8",
		               "value": "65DBEC0B8D154E3488FA5FFE9AC7713F",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "65DBEC0B8D154E3488FA5FFE9AC7713F"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2016-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:ANDNA",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:ANDNA"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "1236790",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "1236790"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "1236790",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "1236790"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "123679",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "123679"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "12367",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "12367"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "1236",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "1236"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "123",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "123"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "A0000000123",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "A0000000123"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:LQ4SG3D28BY",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:LQ4SG3D28BY"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2017-09-26T05:00:00.000Z",
		                    "end": "2019-01-02T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "urn:cerner:identity-federation:realm:687f29dd-69dd-4de5-acb1-fd8a2241ef3a:principal:LQ4Sg3D28BR",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "urn:cerner:identity-federation:realm:687f29dd-69dd-4de5-acb1-fd8a2241ef3a:principal:LQ4Sg3D28BR"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2016-11-01T10:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:LQ4SG3D28BR",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:687F29DD-69DD-4DE5-ACB1-FD8A2241EF3A:PRINCIPAL:LQ4SG3D28BR"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2016-11-01T10:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.8",
		               "value": "9494949494",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "9494949494"
		                         }
		                    ]
		               },
		               "period": {
		                    "start": "2013-09-26T05:00:00.000Z"
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:20A8C75B4900A689D48A72837BF7618B",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:20A8C75B4900A689D48A72837BF7618B"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:E783C85B410291C9F63855A0609B051F",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:E783C85B410291C9F63855A0609B051F"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:4488C85B3102744477F87768F0C84049",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:4488C85B3102744477F87768F0C84049"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:6088C85B78004913B151BA7615AAF455",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:6088C85B78004913B151BA7615AAF455"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:8088C85BCC02239D3CB1F9FE4CC1DAFD",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:8088C85BCC02239D3CB1F9FE4CC1DAFD"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:8688C85B250233295206CBFB5AC866BC",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:8688C85B250233295206CBFB5AC866BC"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:A488C85B610272B838FFABC1F9D50E0C",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:A488C85B610272B838FFABC1F9D50E0C"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:AE88C85BC500DAB370AD741A37EAC3FE",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:AE88C85BC500DAB370AD741A37EAC3FE"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:E988C85BCC00DB004A47C64B1C5752A5",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:E988C85BCC00DB004A47C64B1C5752A5"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:0189C85BCE026E7FA8F139041EB38D22",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:0189C85BCE026E7FA8F139041EB38D22"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:1189C85B3E01C154A7D8EA3A189F0804",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:1189C85B3E01C154A7D8EA3A189F0804"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:6089C85B1D0351DDF1994A0676A2EDB2",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:6089C85B1D0351DDF1994A0676A2EDB2"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:AD8BC85BA503F355F89003D1A8C82A9E",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:AD8BC85BA503F355F89003D1A8C82A9E"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:5E8CC85B1A02B5BDB62B197B09A75199",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:5E8CC85B1A02B5BDB62B197B09A75199"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:678CC85BF40001995D63EBD66EEF5972",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:678CC85BF40001995D63EBD66EEF5972"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:123",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:123"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ12",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ12"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ12345678",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ12345678"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:73CBCD5B30003FA1F0B57750211881B2",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:73CBCD5B30003FA1F0B57750211881B2"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ1234567",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ1234567"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ123456",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:XYZ123456"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:5FA2C75B9001DA1DFE5ED3F3DAF6A517",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:5FA2C75B9001DA1DFE5ED3F3DAF6A517"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:DEA7C75B5602A16A00BF980B3DF70E29",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:DEA7C75B5602A16A00BF980B3DF70E29"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:52A2C75B03026F291330B7DD65327690",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:52A2C75B03026F291330B7DD65327690"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:79A2C75B43008D99899408BB8ACE7DEE",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:79A2C75B43008D99899408BB8ACE7DEE"
		                         }
		                    ]
		               }
		          }, {
		               "use": "usual",
		               "type": {
		                    "coding": [{
		                              "system": "http://hl7.org/fhir/v2/0203",
		                              "code": "AN",
		                              "display": "Account number",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "Federated Person Principal"
		               },
		               "system": "urn:oid:2.16.840.1.113883.3.13.6",
		               "value": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:02A4C75B9402DC01FBAAF95A2D72E059",
		               "_value": {
		                    "extension": [{
		                              "url": "http://hl7.org/fhir/StructureDefinition/rendered-value",
		                              "valueString": "URN:CERNER:IDENTITY-FEDERATION:REALM:2E882EFF-FA72-4882-ADC8-A685F7D2BFA6:PRINCIPAL:02A4C75B9402DC01FBAAF95A2D72E059"
		                         }
		                    ]
		               }
		          }
		     ],
		     "active": true,
		     "name": [{
		               "use": "official",
		               "text": "SMART, WILMA",
		               "family": ["SMART"],
		               "given": ["WILMA"],
		               "period": {
		                    "start": "2016-06-22T20:25:58.000Z"
		               }
		          }, {
		               "use": "maiden",
		               "text": "WILLIAMS,",
		               "family": ["WILLIAMS"],
		               "period": {
		                    "start": "2017-03-09T19:37:17.000Z"
		               }
		          }, {
		               "use": "old",
		               "text": "SMART, WILMA",
		               "family": ["SMART"],
		               "given": ["WILMA"],
		               "period": {
		                    "start": "2016-06-22T20:25:58.000Z",
		                    "end": "2019-05-21T19:06:08.000Z"
		               }
		          }
		     ],
		     "telecom": [{
		               "system": "phone",
		               "value": "8165477777",
		               "use": "work",
		               "period": {
		                    "start": "2017-06-27T17:28:04.000Z"
		               }
		          }, {
		               "system": "phone",
		               "value": "8169519999",
		               "use": "home",
		               "period": {
		                    "start": "2017-02-07T18:56:52.000Z"
		               }
		          }, {
		               "system": "phone",
		               "value": "5032458888",
		               "use": "mobile",
		               "period": {
		                    "start": "2017-06-27T17:31:07.000Z"
		               }
		          }, {
		               "system": "email",
		               "value": "Alt2_wilmasmart@google.com",
		               "use": "work",
		               "period": {
		                    "start": "2019-10-22T20:11:00.000Z"
		               }
		          }, {
		               "system": "email",
		               "value": "wilma_smart@google.com",
		               "use": "home",
		               "period": {
		                    "start": "2017-12-01T16:52:18.000Z"
		               }
		          }
		     ],
		     "gender": "female",
		     "birthDate": "1950-03-13",
		     "address": [{
		               "use": "home",
		               "text": "1200 Grand Road\n_\nKansas City, MO 16145\nUSA",
		               "line": ["1200 Grand Road", "_"],
		               "city": "Kansas City",
		               "district": "Jackson",
		               "state": "MO",
		               "postalCode": "16145",
		               "country": "USA",
		               "period": {
		                    "start": "2017-02-07T18:56:52.000Z"
		               }
		          }
		     ],
		     "maritalStatus": {
		          "coding": [{
		                    "system": "http://hl7.org/fhir/v3/MaritalStatus",
		                    "code": "D",
		                    "display": "Divorced",
		                    "userSelected": false
		               }
		          ],
		          "text": "Divorced"
		     },
		     "contact": [{
		               "relationship": [{
		                         "text": "Authorized Representative"
		                    }
		               ],
		               "name": {
		                    "use": "official",
		                    "text": "TEST, LISA",
		                    "family": ["TEST"],
		                    "given": ["LISA"],
		                    "period": {
		                         "start": "2008-08-21T16:11:46.000Z"
		                    }
		               },
		               "telecom": [{
		                         "system": "phone",
		                         "value": "1234567888",
		                         "use": "home",
		                         "period": {
		                              "start": "2012-01-06T21:06:50.000Z"
		                         }
		                    }
		               ],
		               "address": {
		                    "use": "home",
		                    "text": "123 Test Ln\nSchenectady, NY 12345\nUSA",
		                    "line": ["123 Test Ln"],
		                    "city": "Schenectady",
		                    "district": "Schenectady",
		                    "state": "NY",
		                    "postalCode": "12345",
		                    "country": "USA",
		                    "period": {
		                         "start": "2012-01-06T21:06:50.000Z"
		                    }
		               },
		               "gender": "female",
		               "period": {
		                    "start": "2019-04-11T20:54:02.000Z",
		                    "end": "2019-05-16T16:16:12.000Z"
		               }
		          }, {
		               "relationship": [{
		                         "text": "Authorized Representative"
		                    }
		               ],
		               "name": {
		                    "use": "official",
		                    "text": "Smart, Nancy",
		                    "family": ["Smart"],
		                    "given": ["Nancy"],
		                    "period": {
		                         "start": "2018-12-03T16:37:19.000Z"
		                    }
		               },
		               "period": {
		                    "start": "2018-12-03T16:37:16.000Z",
		                    "end": "2018-12-04T09:17:39.000Z"
		               }
		          }, {
		               "relationship": [{
		                         "text": "Authorized Representative"
		                    }
		               ],
		               "name": {
		                    "use": "official",
		                    "text": "SMART Jr, FRED RICK",
		                    "family": ["SMART"],
		                    "given": ["FRED", "RICK"],
		                    "prefix": ["Mr"],
		                    "suffix": ["Jr"],
		                    "period": {
		                         "start": "2016-08-31T18:24:54.000Z"
		                    }
		               },
		               "telecom": [{
		                         "system": "phone",
		                         "value": "8168889999",
		                         "use": "home",
		                         "period": {
		                              "start": "2017-11-16T17:18:18.000Z"
		                         }
		                    }, {
		                         "system": "email",
		                         "value": "ashley.hensiek@cerner.com",
		                         "use": "home",
		                         "period": {
		                              "start": "2018-09-13T16:54:27.000Z"
		                         }
		                    }
		               ],
		               "address": {
		                    "use": "home",
		                    "text": "1000 Rockhill Rd\nApartment 2\nKansas City, MO 64114\nUSA",
		                    "line": ["1000 Rockhill Rd", "Apartment 2"],
		                    "city": "Kansas City",
		                    "district": "Jackson",
		                    "state": "MO",
		                    "postalCode": "64114",
		                    "country": "USA",
		                    "period": {
		                         "start": "2017-11-16T17:18:18.000Z"
		                    }
		               },
		               "gender": "male",
		               "period": {
		                    "start": "2017-12-28T15:41:08.000Z",
		                    "end": "2018-01-04T04:57:53.000Z"
		               }
		          }, {
		               "relationship": [{
		                         "text": "Power of Attorney"
		                    }
		               ],
		               "name": {
		                    "use": "official",
		                    "text": "CROWN, ADAM",
		                    "family": ["CROWN"],
		                    "given": ["ADAM"],
		                    "period": {
		                         "start": "2017-10-05T17:21:05.000Z"
		                    }
		               },
		               "telecom": [{
		                         "system": "phone",
		                         "value": "8162012074",
		                         "use": "home",
		                         "period": {
		                              "start": "2017-10-05T17:21:04.000Z"
		                         }
		                    }, {
		                         "system": "email",
		                         "value": "adam.crown@cerner.com",
		                         "use": "home",
		                         "period": {
		                              "start": "2017-10-05T17:23:17.000Z"
		                         }
		                    }
		               ],
		               "address": {
		                    "use": "home",
		                    "text": "2800 Rockcreek Parkway\nRandolph, MO 64117\nUSA",
		                    "line": ["2800 Rockcreek Parkway"],
		                    "city": "Randolph",
		                    "district": "Clay",
		                    "state": "MO",
		                    "postalCode": "64117",
		                    "country": "USA",
		                    "period": {
		                         "start": "2017-10-05T17:21:04.000Z"
		                    }
		               },
		               "gender": "male",
		               "period": {
		                    "start": "2019-04-26T19:08:56.000Z",
		                    "end": "2019-05-16T16:16:12.000Z"
		               }
		          }, {
		               "relationship": [{
		                         "text": "Power of Attorney"
		                    }
		               ],
		               "name": {
		                    "use": "official",
		                    "text": "SMART Jr, FRED RICK",
		                    "family": ["SMART"],
		                    "given": ["FRED", "RICK"],
		                    "prefix": ["Mr"],
		                    "suffix": ["Jr"],
		                    "period": {
		                         "start": "2016-08-31T18:24:54.000Z"
		                    }
		               },
		               "telecom": [{
		                         "system": "phone",
		                         "value": "8168889999",
		                         "use": "home",
		                         "period": {
		                              "start": "2017-11-16T17:18:18.000Z"
		                         }
		                    }, {
		                         "system": "email",
		                         "value": "ashley.hensiek@cerner.com",
		                         "use": "home",
		                         "period": {
		                              "start": "2018-09-13T16:54:27.000Z"
		                         }
		                    }
		               ],
		               "address": {
		                    "use": "home",
		                    "text": "1000 Rockhill Rd\nApartment 2\nKansas City, MO 64114\nUSA",
		                    "line": ["1000 Rockhill Rd", "Apartment 2"],
		                    "city": "Kansas City",
		                    "district": "Jackson",
		                    "state": "MO",
		                    "postalCode": "64114",
		                    "country": "USA",
		                    "period": {
		                         "start": "2017-11-16T17:18:18.000Z"
		                    }
		               },
		               "gender": "male",
		               "period": {
		                    "start": "2019-04-26T19:37:12.000Z",
		                    "end": "2019-05-16T16:16:12.000Z"
		               }
		          }
		     ],
		     "communication": [{
		               "language": {
		                    "coding": [{
		                              "system": "urn:ietf:bcp:47",
		                              "code": "en",
		                              "display": "English",
		                              "userSelected": false
		                         }
		                    ],
		                    "text": "English"
		               },
		               "preferred": true
		          }
		     ]
		};
	}

	window.getPractitionerMock = function () {
		return {
		     "data": {
		          "resourceType": "Practitioner",
		          "id": "4464007",
		          "meta": {
		               "versionId": "4",
		               "lastUpdated": "2018-09-17T20:39:57.000Z"
		          },
		          "text": {
		               "status": "generated",
		               "div": "<div><p><b>Practitioner</b></p><p><b>Name</b>: Portal, Portal</p><p><b>Status</b>: Active</p></div>"
		          },
		          "active": true,
		          "name": {
		               "use": "usual",
		               "text": "Portal, Portal",
		               "family": ["Portal"],
		               "given": ["Portal"],
		               "period": {
		                    "start": "2016-08-23T19:09:16.000Z"
		               }
		          },
		          "telecom": [{
		                    "system": "phone",
		                    "value": "8165554141",
		                    "use": "work"
		               }
		          ]
		     },
		     "status": "success",
		     "config": {
		          "type": "Practitioner",
		          "id": "4464007",
		          "baseUrl": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "auth": {
		               "bearer": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ"
		          },
		          "headers": {
		               "Authorization": "Bearer eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ",
		               "Accept": "application/json",
		               "Content-Type": "application/json"
		          },
		          "credentials": "",
		          "method": "GET",
		          "url": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Practitioner/4464007"
		     }
		}
	};
	
	window.getSmartContextMock = function () {
		return {
		     "server": {
		          "serviceUrl": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "auth": {
		               "type": "bearer",
		               "token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ"
		          }
		     },
		     "api": {},
		     "patient": {
		          "id": "4342008",
		          "api": {}
		     },
		     "userId": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Practitioner/4464007",
		     "user": {},
		     "state": {
		          "client": {
		               "client_id": "47c085b8-75a8-4ab8-ada4-c3bfcfee1efb",
		               "scope": "patient/Patient.read patient/Observation.read user/Practitioner.read launch online_access openid profile",
		               "redirect_uri": "https://sklements.github.io/smart-on-fhir-tutorial/example-smart-app/",
		               "launch": "f23107b2-1440-4d12-9f2f-dc56f0d8e7a7"
		          },
		          "response_type": "code",
		          "server": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "provider": {
		               "name": "SMART on FHIR Testing Server",
		               "description": "Dev server for SMART on FHIR",
		               "url": "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		               "oauth2": {
		                    "registration_uri": null,
		                    "authorize_uri": "https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/personas/provider/authorize",
		                    "token_uri": "https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/token"
		               }
		          }
		     },
		     "tokenResponse": {
		          "need_patient_banner": true,
		          "id_token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5NS5yc2EiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJwb3J0YWwiLCJhdWQiOiI0N2MwODViOC03NWE4LTRhYjgtYWRhNC1jM2JmY2ZlZTFlZmIiLCJwcm9maWxlIjoiaHR0cHM6XC9cL2ZoaXItZWhyLnNhbmRib3hjZXJuZXIuY29tXC9kc3R1MlwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9QcmFjdGl0aW9uZXJcLzQ0NjQwMDciLCJpc3MiOiJodHRwczpcL1wvYXV0aG9yaXphdGlvbi5zYW5kYm94Y2VybmVyLmNvbVwvdGVuYW50c1wvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9vaWRjXC9pZHNwc1wvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC8iLCJuYW1lIjoiUG9ydGFsLCBQb3J0YWwiLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywiZmhpclVzZXIiOiJodHRwczpcL1wvZmhpci1laHIuc2FuZGJveGNlcm5lci5jb21cL2RzdHUyXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL1ByYWN0aXRpb25lclwvNDQ2NDAwNyJ9.Myd2rjkVgwHNoTRh4qVlG672-xjJHWtqRNIXupNmWitbvCSVJ6IgazmdXJMr9x_5fr-fYxomB6Pl4q399brgQ4-8ifVqSmzPpTt-oX1y6tHRZKCRgHUYn-AsAR7k5gH-3xOf_H6ip3SvD37moUfJNeCw1WYBH1lf5QIfxv7PMvVeO5-LE8IcG7xlpE0yI-fm0P8T_8y4N5vBftLDN1Q_WyJywzRVUWfC5MTqFPZI7WmFYy99bavxLAAnK-oqVbsnQ1rdYYz1VnBXFmGpHv3RCpWGw00F27k1yA6injp4S4Kp6FZkzoRQsTxMo_qIQvE7lvaKp_UMMf3DaB_ey0vamw",
		          "smart_style_url": "https://smart.sandboxcerner.com/styles/smart-v1.json",
		          "encounter": "4027906",
		          "token_type": "Bearer",
		          "access_token": "eyJraWQiOiIyMDE5LTEyLTEzVDAzOjA2OjM2LjY5Mi5lYyIsInR5cCI6IkpXVCIsImFsZyI6IkVTMjU2In0.eyJzdWIiOiJwb3J0YWwiLCJ1cm46Y29tOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltcyI6eyJ2ZXIiOiIxLjAiLCJlbmNvdW50ZXIiOiI0MDI3OTA2IiwidG50IjoiMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhIiwiYXpzIjoicGF0aWVudFwvUGF0aWVudC5yZWFkIHBhdGllbnRcL09ic2VydmF0aW9uLnJlYWQgdXNlclwvUHJhY3RpdGlvbmVyLnJlYWQgbGF1bmNoIG9ubGluZV9hY2Nlc3Mgb3BlbmlkIHByb2ZpbGUiLCJ1c2VyIjoiNDQ2NDAwNyIsInBhdGllbnQiOiI0MzQyMDA4In0sImF6cCI6IjQ3YzA4NWI4LTc1YTgtNGFiOC1hZGE0LWMzYmZjZmVlMWVmYiIsImlzcyI6Imh0dHBzOlwvXC9hdXRob3JpemF0aW9uLnNhbmRib3hjZXJuZXIuY29tXC8iLCJleHAiOjE1NzYyNTE0MDMsImlhdCI6MTU3NjI1MDgwMywianRpIjoiOWE3MzM3YWUtODFlOC00NGQwLWExNDktZjZkZWZmY2Y3ODkxIiwidXJuOmNlcm5lcjphdXRob3JpemF0aW9uOmNsYWltczp2ZXJzaW9uOjEiOnsidmVyIjoiMS4wIiwicHJvZmlsZXMiOnsibWlsbGVubml1bS12MSI6eyJwZXJzb25uZWwiOiI0NDY0MDA3IiwiZW5jb3VudGVyIjoiNDAyNzkwNiJ9LCJzbWFydC12MSI6eyJwYXRpZW50cyI6WyI0MzQyMDA4Il0sImF6cyI6InBhdGllbnRcL1BhdGllbnQucmVhZCBwYXRpZW50XC9PYnNlcnZhdGlvbi5yZWFkIHVzZXJcL1ByYWN0aXRpb25lci5yZWFkIGxhdW5jaCBvbmxpbmVfYWNjZXNzIG9wZW5pZCBwcm9maWxlIn19LCJjbGllbnQiOnsibmFtZSI6IkhvbG9uIEluc2lnaHRzIFNlbnNvciIsImlkIjoiNDdjMDg1YjgtNzVhOC00YWI4LWFkYTQtYzNiZmNmZWUxZWZiIn0sInVzZXIiOnsicHJpbmNpcGFsIjoicG9ydGFsIiwicGVyc29uYSI6InByb3ZpZGVyIiwiaWRzcCI6IjBiOGEwMTExLWU4ZTYtNGMyNi1hOTFjLTUwNjljYmM2YjFjYSIsInNlc3Npb25JZCI6IjU3Zjg2ODI1LWUxN2YtNGEyZS05OTAwLWU2NGQ3ZjA2M2RiNCIsInByaW5jaXBhbFR5cGUiOiJVU0VSTkFNRSIsInByaW5jaXBhbFVyaSI6Imh0dHBzOlwvXC9taWxsZW5uaWEuc2FuZGJveGNlcm5lci5jb21cL2luc3RhbmNlXC8wYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2FcL3ByaW5jaXBhbFwvMDAwMC4wMDAwLjAwNDQuMUQ4NyIsImlkc3BVcmkiOiJodHRwczpcL1wvbWlsbGVubmlhLnNhbmRib3hjZXJuZXIuY29tXC9hY2NvdW50c1wvZmhpcnBsYXkudGVtcF9yaG8uY2VybmVyYXNwLmNvbVwvMGI4YTAxMTEtZThlNi00YzI2LWE5MWMtNTA2OWNiYzZiMWNhXC9sb2dpbiJ9LCJ0ZW5hbnQiOiIwYjhhMDExMS1lOGU2LTRjMjYtYTkxYy01MDY5Y2JjNmIxY2EifX0.CEdcIYAQC4NThRWb2q30sudXfAJeVlTca6ybHVd1cWqmsiWoMTdkNVt4nvHoenyAWfqca4zvqOnrephq64hzCQ",
		          "refresh_token": "eyJpZCI6IjJjZGNiZjk5LWJhNzAtNDEyYS05MzgwLWRiNDYxZTYzZGE3NCIsInNlY3JldCI6IjRkNWFjZjkwLWU3ZGEtNDM0MC1iNzQ5LTExYTUzMmZjM2QwMiIsInZlciI6IjEuMCIsInR5cGUiOiJvbmxpbmVfYWNjZXNzIiwicHJvZmlsZSI6InNtYXJ0LXYxIn0=",
		          "patient": "4342008",
		          "scope": "patient/Patient.read patient/Observation.read user/Practitioner.read launch online_access openid profile",
		          "expires_in": 570,
		          "user": "4464007",
		          "tenant": "0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca",
		          "username": "portal",
		          "code": "45b1405d-8013-492a-99a3-e598099ae842",
		          "state": "2e5ae7bc-b364-2bf2-f588-c2d35e76cab8"
		     }
		};
	}
	
})(window);
