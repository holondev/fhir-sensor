package io.collabornet.smart.sensor.model;

import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(Include.NON_NULL)
public class SensedContext implements Serializable {
	@JsonIgnore
	private static final long serialVersionUID = 1L;
	
	// private String tenantId;
	// private String patientId;
	// private String userId;
	
	private String patient;
	private String practitioner;
	private String smartContext;
	
}
