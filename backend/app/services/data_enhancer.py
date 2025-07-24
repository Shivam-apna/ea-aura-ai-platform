"""
Data enhancement service for agents
"""

def get_enhanced_data_for_agent(agent_name: str, input_text: str):
    """Get enhanced data based on agent type"""
    from app.services.es_search import (
        query_sales_data,
        query_marketing_dataset,
        query_customer_survey_data,
        query_social_media_dataset,
        query_support_tickets_dataset,
        query_mission_alignment_data,
        query_brand_audit_data,
        query_social_media_engagement_dataset
    )
    
    def query_business_vitality_combined(query_text):
        """Query both sales and marketing datasets for business vitality agent"""
        sales_data = query_sales_data(query_text=query_text)
        marketing_data = query_marketing_dataset(query_text=query_text)
        
        # Combine both datasets with clear separators
        combined_data = f"""=== SALES DATA ===
{sales_data}

=== MARKETING DATA ===
{marketing_data}"""
        
        return combined_data
    
    def query_customer_analyzer_combined(query_text):
        """Query customer survey, social media, and support tickets datasets for customer analyzer agent"""
        customer_survey_data = query_customer_survey_data(query_text=query_text)
        social_media_data = query_social_media_dataset(query_text=query_text)
        support_tickets_data = query_support_tickets_dataset(query_text=query_text)
        
        # Combine all three datasets with clear separators
        combined_data = f"""=== CUSTOMER SURVEY DATA ===
{customer_survey_data}

=== SOCIAL MEDIA DATA ===
{social_media_data}

=== SUPPORT TICKETS DATA ===
{support_tickets_data}"""
        
        return combined_data
    
    def query_brand_index_combined(query_text):
        """Query brand audit and social media engagement datasets for brand index agent"""
        brand_audit_data = query_brand_audit_data(query_text=query_text)
        social_media_engagement_data = query_social_media_engagement_dataset(query_text=query_text)
        
        # Combine both datasets with clear separators
        combined_data = f"""=== BRAND AUDIT DATA ===
{brand_audit_data}

=== SOCIAL MEDIA ENGAGEMENT DATA ===
{social_media_engagement_data}"""
        
        return combined_data
    
    # Map agent names to data queries
    agent_data_mapping = {
        # Parent agents with combined datasets
        "business_vitality_agent": lambda: query_business_vitality_combined(input_text),
        "customer_analyzer_agent": lambda: query_customer_analyzer_combined(input_text),
        "brand_index_agent": lambda: query_brand_index_combined(input_text),
        "strategic_alignment_agent": lambda: query_mission_alignment_data(query_text=input_text),
        
        # Sub-agents with specific datasets
        # Business vitality sub-agents
        "sales_analyzer_agent": lambda: query_sales_data(query_text=input_text),
        "marketing_analyzer_agent": lambda: query_marketing_dataset(query_text=input_text),
        
        # Customer analyzer sub-agents
        "customer_survey_agent": lambda: query_customer_survey_data(query_text=input_text),
        "social_media_analyzer_agent": lambda: query_social_media_dataset(query_text=input_text),
        "support_tickets_analyzer_agent": lambda: query_support_tickets_dataset(query_text=input_text),
        
        # Brand index sub-agents
        "website_analyzer_agent": lambda: query_brand_audit_data(query_text=input_text),
        "social_media_engagement_agent": lambda: query_social_media_engagement_dataset(query_text=input_text)
    }
    
    return agent_data_mapping.get(agent_name, lambda: input_text)()