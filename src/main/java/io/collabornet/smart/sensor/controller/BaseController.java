package io.collabornet.smart.sensor.controller;

import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.boot.configurationprocessor.json.JSONObject;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import io.collabornet.smart.sensor.model.SensedContext;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BaseController {
	@Value("${app.oauth2.clientId}")
	String clientId;
	
	@Value("${app.oauth2.scope}")
	String scope;
	
	@Value("${app.redirectUrl}")
	String redirectUrl;
	
	@GetMapping("/launch")
	public String launchPage(Model model) {
		log.info("clientId: " + clientId);
		log.info("scope: " + scope);
		model.addAttribute("clientId", clientId);
		model.addAttribute("scope", scope);
		return "launch";
	}
	
	@GetMapping({ "/", "/index" })
	public String indexPage(Model model) {
		log.info("redirectUrl: " + redirectUrl);
		model.addAttribute("redirectUrl", redirectUrl);
		model.addAttribute("patientText", "Patient");
		model.addAttribute("practitionerText", "Practitioner");
		model.addAttribute("hiveStatus", "Posting Patient Context To Hive...");
		
		return "index";
	}
	
	@GetMapping("/health")
	public String healthPage(Model model) {
		return "health";
	}
	
	@RequestMapping(value = "/sensedContext", params = { "tenantId", "mrn", "npi" }, method = RequestMethod.GET)
	@ResponseBody
	public String getSensedContext(@RequestParam("tenantId") String tenantId, @RequestParam("mrn") String mrn,
		@RequestParam("npi") String npi, Model model) {
		
		log.info("tenantId: " + tenantId);
		log.info("mrn: " + mrn);
		log.info("npi: " + npi);
		
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(redirectUrl)
			// Add query parameter
			.queryParam("tenantId", tenantId).queryParam("mrn", mrn).queryParam("npi", npi);
		
		log.info("url: " + builder.toUriString());
		
		RestTemplate restTemplate = new RestTemplate();
		String response = restTemplate.getForObject(builder.toUriString(), String.class);
		
		log.info("response: " + response);
		
		return response;
	}
	
	@PostMapping("/sensedContext")
	@ResponseBody
	public String postSensedContext(@Valid @RequestBody SensedContext sensedContext, BindingResult result, Model model)
		throws JSONException {
		
		log.info("sensedContext: " + sensedContext.toString());
		
		if (result.hasErrors()) {
			return "post-sensed-context-errors";
		}
		
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.set("Content-Type", "application/json");
		
		JSONObject jsonRequest = new JSONObject();
		
		jsonRequest.put("patient", sensedContext.getPatient());
		jsonRequest.put("practitioner", sensedContext.getPractitioner());
		jsonRequest.put("smartContext", sensedContext.getSmartContext());
		
		log.info("jsonRequest: " + jsonRequest.toString());
		
		HttpEntity<String> httpEntity = new HttpEntity<String>(jsonRequest.toString(), httpHeaders);
		
		RestTemplate restTemplate = new RestTemplate();
		String response = restTemplate.postForObject(redirectUrl, httpEntity, String.class);
		
		log.info("response: " + response);
		
		String hiveStatus = "Patient Context Successfully Posted to Hive";
		
		if (response == null) {
			hiveStatus = "Error Posting Patient Context to Hive. See Mirth Dashboard for details.";
		}
		model.addAttribute("hiveStatus", hiveStatus);
		
		JSONObject jsonResponse = new JSONObject(response);
		jsonResponse.put("hiveStatus", hiveStatus);
		
		return jsonResponse.toString();
	}
}
